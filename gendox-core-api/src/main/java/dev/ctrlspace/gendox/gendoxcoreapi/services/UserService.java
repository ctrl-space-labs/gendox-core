package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.authentication.AuthenticationService;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.JwtDTOUserProfileConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.UserProfileConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserDetailsDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.UserCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.UserPredicate;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import io.micrometer.observation.annotation.Observed;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class UserService implements UserDetailsService {

    Logger logger = LoggerFactory.getLogger(UserService.class);


    private UserRepository userRepository;
    private JwtDTOUserProfileConverter jwtDTOUserProfileConverter;
    private JWTUtils jwtUtils;
    private UserProfileConverter userProfileConverter;
    private TypeService typeService;
    private AuthenticationService authenticationService;


    @Autowired
    public UserService(UserRepository userRepository,
                       JWTUtils jwtUtils,
                       JwtDTOUserProfileConverter jwtDTOUserProfileConverter,
                       UserProfileConverter userProfileConverter,
                       TypeService typeService,
                       AuthenticationService authenticationService) {
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
        this.userProfileConverter = userProfileConverter;
        this.jwtDTOUserProfileConverter = jwtDTOUserProfileConverter;
        this.typeService = typeService;
        this.authenticationService = authenticationService;
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

    public User getByUsername(String username) throws GendoxException {
        return userRepository.findByUserName(username)
                .orElse(null);
    }

    /**
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

    public Boolean isUserExistByUserName(String userName) throws GendoxException {
        return userRepository.existsByUserName(userName);
    }

    public Boolean isIdentifierUserExistsByUserName(String userName) throws GendoxException {
        if (authenticationService.getUsersByUsername(userName).isEmpty()) {
            return false;
        }
        return true;
    }

    public User createUser(User user) throws GendoxException {
        Instant now = Instant.now();

        if (user.getUserType() == null) {
            user.setUserType(typeService.getUserTypeByName("GENDOX_USER"));
        }

        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        user = userRepository.save(user);
        return user;

    }

    public User createDiscordUser(String author) throws GendoxException {
        User user = new User();
        user.setUserName(author);
        user.setUserType(typeService.getUserTypeByName("DISCORD_USER"));

        user = createUser(user);

        return user;

    }

    public String createIdentifierUser(User user) throws GendoxException {
        return authenticationService.createUser(user, null, true, false);
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
}
