package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.authentication.ApiKeyAuthenticationToken;
import dev.ctrlspace.gendox.authentication.GendoxAuthenticationToken;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.UserConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.UserProfileConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.UserDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.UserPublicDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.UserCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import io.micrometer.observation.annotation.Observed;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;

import java.util.UUID;

@RestController
public class UserController {


    Logger logger = LoggerFactory.getLogger(UserController.class);


    //    @Autowired
    private UserService userService;
    private JWTUtils jwtUtils;
    private UserProfileConverter userProfileConverter;
    private UserConverter userConverter;
    private OrganizationService organizationService;

    @Autowired
    public UserController(UserService userService,
                          JWTUtils jwtUtils,
                          UserProfileConverter userProfileConverter,
                          UserConverter userConverter,
                          OrganizationService organizationService) {
        this.userService = userService;
        this.jwtUtils = jwtUtils;
        this.userProfileConverter = userProfileConverter;
        this.userConverter = userConverter;
        this.organizationService = organizationService;
    }


//    @PreAuthorize("@securityUtils.hasAuthorityToRequestedOrgId('OP_READ_DOCUMENT') " +
//            "|| @securityUtils.hasAuthorityToRequestedProjectId()")
    @GetMapping("/users")
    @Operation(summary = "Get all users",
            description = "Retrieve a list of all users based on the provided criteria.")
    public Page<User> getAllUsers(@Valid UserCriteria criteria, Pageable pageable) throws Exception {

        // run code to get the user from the database
        return userService.getAllUsers(criteria, pageable);
    }


    @GetMapping("/users/public")
    @Operation(summary = "Get all users",
            description = "Retrieve a list of all users with public data like id and email, based on the provided criteria.")
    public Page<UserPublicDTO> getAllUsersPublic(@Valid UserCriteria criteria, Pageable pageable) throws GendoxException {

            return userService.getAllPublicUsers(criteria, pageable);
    }


    // TODO add authorization check if the user belongs to the same organization

    @GetMapping("/users/{id}")
    @Operation(summary = "Get user by ID",
            description = "Retrieve a user by their unique ID.")
    public User getUserById(@PathVariable UUID id, Authentication authentication) throws Exception {

        // run code to get the user from the database
        User user = userService.getById(id);

        return user;
    }


    @GetMapping("/profile")
    @Operation(summary = "Get user profile by ID",
            description = "Retrieve a user's profile by their unique ID.")
    @Observed(name = "UserController.getUserUserProfile",
            contextualName = "UserController#getUserUserProfile",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public UserProfile getUserUserProfile(Authentication authentication) throws Exception {


        if (authentication instanceof ApiKeyAuthenticationToken || authentication instanceof GendoxAuthenticationToken) {
            UserProfile loginPrincipalProfile = (UserProfile) authentication.getPrincipal();
            return loginPrincipalProfile;

        }

        throw new GendoxException("USER_PROFILE_NOT_FOUND", "User profile not found", HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/profile/caches")
    public String logout(Authentication authentication) {
        String userIdentifier = ((UserProfile) authentication.getPrincipal()).getEmail();
        userService.evictUserProfileByUniqueIdentifier(userIdentifier);
        return "User logged out successfully.";
    }

    @PostMapping("users/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void userLogout(Authentication authentication) {
        String userIdentifier = ((UserProfile) authentication.getPrincipal()).getEmail();
        userService.evictUserProfileByUniqueIdentifier(userIdentifier);
    }

    // TODO this is just for demo purposes, need to be rewrite
//    @GetMapping("/users/login")
//    @Operation(summary = "Get users token by email or user name",
//            description = "Retrieve user information based on their email address or username. " +
//                    "This method decodes the user's JWT based on the provided email or username " +
//                    "and returns a JWTResponse containing the user's JWT token.")
//    @Observed(name = "user.login",
//            contextualName = "user-login-method",
//            lowCardinalityKeyValues = {
//                    ObservabilityTags.LOGGABLE, "true",
//            })
//    public JwtResponse getUserByLogin(@RequestParam("userIdentifier") String userIdentifier) throws Exception {
//
//        // run code to get the user from the database
//        JwtClaimsSet claims = userService.getJwtClaims(userIdentifier);
//
//        String jwt = jwtUtils.toJwtString(claims);
//        return new JwtResponse(jwt);
//    }

    @PostMapping(value = "/users", consumes = {"application/json"})
    @ResponseStatus(value = HttpStatus.CREATED)
    public User createUser(@RequestBody UserDTO userDTO) throws GendoxException {
        if (userDTO.getId() != null) {
            throw new GendoxException("USER_ID_MUST_BE_NULL", "User id is not null", HttpStatus.BAD_REQUEST);
        }
        User user = userConverter.toEntity(userDTO);
        user = userService.createUser(user);
        return user;
    }

//
//    @PostMapping("/users")
//    @ResponseStatus(value = HttpStatus.CREATED)
//    public User createUser(@RequestBody User user) throws Exception {
//
//        // validate
//        user = userService.createUser(user);
//
//        return user;
//    }
//
//    @PutMapping("/users/{id}")
//    public User updateUser(@PathVariable Long id, @RequestBody User user, Authentication authentication) throws Exception {
//
//        user = userService.updateUser(user);
//
//        return user;
//    }
//
//    @DeleteMapping("/users/{id}")
//    @ResponseStatus(HttpStatus.NO_CONTENT)
//    public void deleteUser(@PathVariable Long id) {
//        // validate
//        userService.deleteUser(id);
//    }


    @PutMapping("/users/{id}")
    public User updateUser(@PathVariable UUID id, @RequestBody UserDTO userDTO) throws GendoxException {
        User user = new User();
        user = userConverter.toEntity(userDTO);

        if (!id.equals(user.getId())) {
            throw new GendoxException("User's_ID_MISMATCH", "User's ID in path and ID in body are not the same", HttpStatus.BAD_REQUEST);
        }

        user = userService.updateUser(user);
        return user;
    }

    @PutMapping("/users/{userId}/deactivate")
    public void deactivateUserById(@PathVariable UUID userId, Authentication authentication) throws GendoxException {
        userService.deactivateUserById(userId, authentication);
        String userIdentifier = ((UserProfile) authentication.getPrincipal()).getEmail();
        userService.evictUserProfileByUniqueIdentifier(userIdentifier);
    }
}
