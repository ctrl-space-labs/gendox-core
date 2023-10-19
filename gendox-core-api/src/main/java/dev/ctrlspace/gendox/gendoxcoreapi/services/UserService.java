package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.JwtDTOUserProfileConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.UserProfileConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserDetailsDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.UserCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.UserPredicate;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class UserService implements UserDetailsService {

    private UserRepository userRepository;
    private JwtDTOUserProfileConverter jwtDTOUserProfileConverter;
    private JWTUtils jwtUtils;
    private UserProfileConverter userProfileConverter;
    private TypeService typeService;


    @Autowired
    public UserService(UserRepository userRepository,
                       JWTUtils jwtUtils,
                       JwtDTOUserProfileConverter jwtDTOUserProfileConverter,
                       UserProfileConverter userProfileConverter,
                       TypeService typeService) {
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
        this.userProfileConverter = userProfileConverter;
        this.jwtDTOUserProfileConverter = jwtDTOUserProfileConverter;
        this.typeService = typeService;
    }

    public Page<User> getAllUsers(UserCriteria criteria) {

        Pageable pageable = PageRequest.of(0, 100);
        return this.getAllUsers(criteria, pageable);
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
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new GendoxException("USER_NOT_FOUND", "User not found with email: " + email, HttpStatus.NOT_FOUND));
    }

    /**
     *
     * @param userIdentifier can be either the email or username or phone number
     * @return
     * @throws GendoxException
     */
    public UserProfile getUserProfileByUniqueIdentifier(String userIdentifier) throws GendoxException {

        UserCriteria criteria = UserCriteria
                .builder()
                .userIdentifier(userIdentifier)
                .build();

        User user = getAllUsers(criteria).stream()
                .findFirst()
                .orElseThrow(() -> new GendoxException("USER_NOT_FOUND", "User not found with identifier: " + userIdentifier, HttpStatus.NOT_FOUND));
        return userProfileConverter.toDTO(user);
    }

    public boolean isUserExistByUserName(String userName) throws GendoxException {
        return userRepository.existsByUserName(userName);
    }

    public User createUser(User user) throws GendoxException {
        Instant now = Instant.now();

        if (user.getId() != null) {
            throw new GendoxException("NEW_PROJECT_ID_IS_NOT_NULL", "Project id must be null", HttpStatus.BAD_REQUEST);
        }

        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        user = userRepository.save(user);
        return user;

    }

    public User createDiscordUser(String author) throws GendoxException {
        User user = new User();
        user.setUserName(author);
        user.setGlobalRole(typeService.getGlobalApplicationRoleTypeByName("ROLE_USER"));
        user.setUserType(typeService.getUserTypeByName("DISCORD_USER"));

        user = createUser(user);

        return user;

    }

    public JwtClaimsSet getJwtClaims(String email) throws GendoxException {

        UserProfile userProfile = this.getUserProfileByUniqueIdentifier(email);

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
}
