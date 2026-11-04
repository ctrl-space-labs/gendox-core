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
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import io.micrometer.observation.annotation.Observed;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;

import java.util.UUID;

@RestController
public class UserController {


    Logger logger = LoggerFactory.getLogger(UserController.class);


    //    @Autowired
    private UserService userService;
    private UserProfileConverter userProfileConverter;
    private UserConverter userConverter;
    private OrganizationService organizationService;
    private SecurityUtils securityUtils;

    @Autowired
    public UserController(UserService userService,
                          UserProfileConverter userProfileConverter,
                          UserConverter userConverter,
                          OrganizationService organizationService,
                          SecurityUtils securityUtils) {
        this.userService = userService;
        this.userProfileConverter = userProfileConverter;
        this.userConverter = userConverter;
        this.organizationService = organizationService;
        this.securityUtils = securityUtils;
    }


    @PreAuthorize("@securityUtils.canSearchUsers(#criteria)")
    @GetMapping("/users")
    @Operation(summary = "Get all users",
            description = "Retrieve the users of an organization or project the caller can read, based on the provided criteria. " +
                    "Only a super admin can search across all users.")
    public Page<User> getAllUsers(@Valid UserCriteria criteria, Pageable pageable) throws Exception {

        // run code to get the user from the database
        return userService.getAllUsers(criteria, pageable);
    }


    @PreAuthorize("@securityUtils.canSearchUsers(#criteria)")
    @GetMapping("/users/public")
    @Operation(summary = "Get all users",
            description = "Retrieve the users of an organization or project the caller can read, with public data like id and email. " +
                    "Only a super admin can search across all users.")
    public Page<UserPublicDTO> getAllUsersPublic(@Valid UserCriteria criteria, Pageable pageable) throws GendoxException {

            return userService.getAllPublicUsers(criteria, pageable);
    }


    @PreAuthorize("@securityUtils.isCurrentUser(#id)")
    @GetMapping("/users/{id}")
    @Operation(summary = "Get user by ID",
            description = "Retrieve a user by their unique ID. Users can read only themselves, unless they are a super admin.")
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

    // Users are registered on their first login; creating one directly is an admin operation
    @PreAuthorize("@securityUtils.isSuperAdmin()")
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

    @PreAuthorize("@securityUtils.isCurrentUser(#id)")
    @PutMapping("/users/{id}")
    @Operation(summary = "Update user",
            description = "Users can change their own names. Email, user name and phone identify the account at login, " +
                    "and the user type grants global roles, so only a super admin can change them.")
    public User updateUser(@PathVariable UUID id, @RequestBody UserDTO userDTO) throws GendoxException {
        User user = userConverter.toEntity(userDTO);

        if (!id.equals(user.getId())) {
            throw new GendoxException("User's_ID_MISMATCH", "User's ID in path and ID in body are not the same", HttpStatus.BAD_REQUEST);
        }

        if (securityUtils.isSuperAdmin()) {
            return userService.updateUser(user);
        }
        return userService.updateUserNames(user);
    }

    @PreAuthorize("@securityUtils.isCurrentUser(#userId)")
    @PutMapping("/users/{userId}/deactivate")
    public void deactivateUserById(@PathVariable UUID userId) throws GendoxException {
        userService.deactivateUserById(userId);
    }
}
