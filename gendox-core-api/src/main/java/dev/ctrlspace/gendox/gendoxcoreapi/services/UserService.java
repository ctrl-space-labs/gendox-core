package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.authentication.AuthenticationService;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.JwtDTOUserProfileConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.UserConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.UserProfileConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserDetailsDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.UserPublicDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.UserCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.UserPredicate;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.OrganizationRolesConstants;
import io.micrometer.observation.annotation.Observed;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class UserService implements UserDetailsService {

    Logger logger = LoggerFactory.getLogger(UserService.class);


    private UserRepository userRepository;
    private JwtDTOUserProfileConverter jwtDTOUserProfileConverter;
    private JWTUtils jwtUtils;
    private UserProfileConverter userProfileConverter;
    private TypeService typeService;
    private AuthenticationService authenticationService;
    private final UserConverter userConverter;
    private ProjectMemberService projectMemberService;

    private OrganizationService organizationService;

    private ProjectService projectService;

    private CacheManager cacheManager;

    private UserOrganizationService userOrganizationService;


    @Autowired
    public UserService(UserRepository userRepository,
                       JWTUtils jwtUtils,
                       JwtDTOUserProfileConverter jwtDTOUserProfileConverter,
                       UserProfileConverter userProfileConverter,
                       TypeService typeService,
                       OrganizationService organizationService,
                       ProjectService projectService,
                       CacheManager cacheManager,
                       AuthenticationService authenticationService,
                       UserConverter userConverter,
                       UserOrganizationService userOrganizationService,
                       ProjectMemberService projectMemberService) {
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
        this.userProfileConverter = userProfileConverter;
        this.jwtDTOUserProfileConverter = jwtDTOUserProfileConverter;
        this.typeService = typeService;
        this.organizationService = organizationService;
        this.projectService = projectService;
        this.cacheManager = cacheManager;
        this.authenticationService = authenticationService;
        this.userConverter = userConverter;
        this.userOrganizationService = userOrganizationService;
        this.projectMemberService = projectMemberService;
    }

    public Page<User> getAllUsers(UserCriteria criteria) {

        Pageable pageable = PageRequest.of(0, 100);
        return this.getAllUsers(criteria, pageable);
    }

    public Page<UserPublicDTO> getAllPublicUsers(UserCriteria criteria, Pageable pageable) throws GendoxException {
        if (pageable == null) {
            throw new GendoxException("Pageable cannot be null", "pageable.null", HttpStatus.BAD_REQUEST);
        }
        Page<User> users = userRepository.findAll(UserPredicate.build(criteria), pageable);

        return users.map(userConverter::toPublicDTO);
    }

    public Page<User> getAllUsers(UserCriteria criteria, Pageable pageable) {
        Predicate whereUserPredicate = UserPredicate.build(criteria);

        return userRepository.findAll(whereUserPredicate, pageable);
    }

    public User getById(UUID id) throws GendoxException {
        return userRepository.findById(id)
                .orElseThrow(() -> new GendoxException("USER_NOT_FOUND", "User not found with id: " + id, HttpStatus.NOT_FOUND));
    }

    public User getByEmail(String email) throws GendoxException {
        return getOptionalByEmail(email)
                .orElseThrow(() -> new GendoxException("USER_NOT_FOUND", "User not found with email: " + email, HttpStatus.NOT_FOUND));
    }

    public Optional<User> getOptionalByEmail(String email) throws GendoxException {
        return userRepository.findByEmail(email);
    }

    /**
     * @param userIdentifier can be either the email or username or phone number
     * @return
     * @throws GendoxException
     */
    public Optional<User> getOptionalUserByUniqueIdentifier(String userIdentifier) throws GendoxException {

        UserCriteria criteria = UserCriteria
                .builder()
                .userIdentifier(userIdentifier)
                .build();

        return getAllUsers(criteria).stream()
                .findFirst();
    }

    /**
     * @param userIdentifier can be either the email or username or phone number
     * @return
     * @throws GendoxException
     */
    public User getUserByUniqueIdentifier(String userIdentifier) throws GendoxException {

        return this.getOptionalUserByUniqueIdentifier(userIdentifier)
                .orElseThrow(() -> new GendoxException("USER_NOT_FOUND", "User not found with identifier: " + userIdentifier, HttpStatus.NOT_FOUND));
    }

    public UserProfile getUserProfileByUserId(UUID userId) throws GendoxException {

        User user = this.getById(userId);
        List<UserOrganizationProjectAgentDTO> rawUser = userRepository.findRawUserProfileById(user.getId());

        return userProfileConverter.toDTO(rawUser);
    }

    /**
     * @param userIdentifier can be either the email or username or phone number
     * @return
     * @throws GendoxException
     */
    @Cacheable(value = "UserProfileByIdentifier", keyGenerator = "gendoxKeyGenerator")
    public UserProfile getUserProfileByUniqueIdentifier(String userIdentifier) throws GendoxException {

        User user = this.getUserByUniqueIdentifier(userIdentifier);
        List<UserOrganizationProjectAgentDTO> rawUser = userRepository.findRawUserProfileById(user.getId());

        return userProfileConverter.toDTO(rawUser);
    }

    public void evictUserProfileByUniqueIdentifier(String userIdentifier) {
        // Evict the cache entry for the user
        Cache cache = cacheManager.getCache("UserProfileByIdentifier");
        if (cache != null) {
            cache.evict("UserService:getUserProfileByUniqueIdentifier:" + userIdentifier);
        }
        logger.debug("Evicting UserProfile cache for userIdentifier: {}", userIdentifier);
    }

    public Boolean isUserExistByUserName(String userName) throws GendoxException {
        return userRepository.existsByUserName(userName);
    }

    public Boolean isUserExistByEmail(String email) throws GendoxException {
        return userRepository.existsByEmail(email);
    }

    public User createUser(User user) throws GendoxException {

        if (user.getUserType() == null) {
            user.setUserType(typeService.getUserTypeByName("GENDOX_USER"));
        }

        user.setEmail(user.getEmail() != null ? user.getEmail().toLowerCase() : null);
        user.setUserName(user.getUserName() != null ? user.getUserName().toLowerCase() : null);

        user = userRepository.save(user);
        return user;

    }

    public User updateUser(User user) throws GendoxException {
        Instant now = Instant.now();

        User existingUser = this.getById(user.getId());
        existingUser.setName(user.getName());
        existingUser.setFirstName(user.getFirstName());
        existingUser.setLastName(user.getLastName());
        existingUser.setUserName(user.getUserName());
        existingUser.setEmail(user.getEmail());
        existingUser.setPhone(user.getPhone());
        existingUser.setUserType(user.getUserType());
        existingUser.setUpdatedAt(now);
        existingUser.setUserOrganizations(user.getUserOrganizations());
        existingUser.setProjectMembers(user.getProjectMembers());
        user = userRepository.save(existingUser);

        return user;


    }

    public User createDiscordUser(String author) throws GendoxException {
        User user = new User();
        user.setUserName(author);
        user.setUserType(typeService.getUserTypeByName("DISCORD_USER"));

        user = createUser(user);

        return user;

    }

    /**
     * Register a new user.
     * It created a new user, a new Organization and a new Project in this organization
     *
     * @param email
     * @return
     * @throws GendoxException
     */
    public User userRegistration(String email) throws GendoxException {
        User user = new User();
        user.setEmail(email);
        user = createUser(user);
        return user;
    }


    @Observed(name = "get.jwt.claims",
            contextualName = "get-jwt-claims",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "true"
            })
    public JwtClaimsSet getJwtClaims(String userIdentifier) throws GendoxException {

        UserProfile userProfile = this.getUserProfileByUniqueIdentifier(userIdentifier);

        JwtDTO jwtDTO = jwtDTOUserProfileConverter.jwtDTO(userProfile);

        return jwtUtils.toClaimsSet(jwtDTO);
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        try {
            return new UserDetailsDTO(getByEmail(email));
        } catch (GendoxException e) {
            throw new UsernameNotFoundException(e.getErrorCode(), e);
        }

    }

    /**
     * Get the user identifier from the user Entity.
     * The logic should be the same as {@link SecurityUtils#getUserIdentifier()}
     *
     * @param user
     * @return
     */
    public String getUserIdentifier(User user) {
        String email = user.getEmail();
        if (email != null) {
            return email;
        }
        return user.getUserName();
    }


    private static final Map<String, Integer> ROLE_LEVEL_MAP = new HashMap<>();

    static {
        ROLE_LEVEL_MAP.put(OrganizationRolesConstants.READER, 1);
        ROLE_LEVEL_MAP.put(OrganizationRolesConstants.EDITOR, 2);
        ROLE_LEVEL_MAP.put(OrganizationRolesConstants.ADMIN, 3);
    }

    public int getUserOrganizationRoleLevel(String roleName) throws GendoxException {
        Integer level = ROLE_LEVEL_MAP.get(roleName);
        if (level == null) {
            throw new GendoxException("UNKNOWN_ROLE", "Unknown role: " + roleName, HttpStatus.BAD_REQUEST);
        }
        return level;
    }

    public void deactivateUserById(UUID userId, Authentication authentication) throws GendoxException {
        // Fetch user by ID
        User user = getById(userId);

        removeUserAssociations(user, authentication);
        clearUserData(user);
        deactivateUser(user);
        userRepository.save(user);
    }

    private void deactivateUser(User user) throws GendoxException {
        authenticationService.deactivateUser(user.getEmail());
    }

    private void clearUserData(User user) {
        user.setName(null);
        user.setFirstName(null);
        user.setLastName(null);
        user.setUserName(null);
        user.setEmail(null);
        user.setPhone(null);
        user.setUserType(null);
        user.setCreatedAt(null);
        user.setUpdatedAt(null);
    }

    private void removeUserAssociations(User user,Authentication authentication) throws GendoxException {
        UserProfile userProfile = (UserProfile) authentication.getPrincipal();
        for (OrganizationUserDTO organization : userProfile.getOrganizations()) {
            UUID organizationId = UUID.fromString(organization.getId());
            userOrganizationService.deleteUserOrganization(organizationId, user.getId());

            for (ProjectOrganizationDTO project : organization.getProjects()) {
                UUID projectId = UUID.fromString(project.getId());
                projectMemberService.removeMemberFromProject(projectId, user.getId());
            }
        }
    }





}