package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.UserConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.UserProfileConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.UserDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.UserCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
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
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;

import java.util.List;
import java.util.UUID;

@RestController
public class UserController {


    Logger logger = LoggerFactory.getLogger(UserController.class);


    //    @Autowired
    private UserService userService;
    private JwtEncoder jwtEncoder;
    private UserProfileConverter userProfileConverter;
    private UserConverter userConverter;

    @Autowired
    public UserController(UserService userService,
                          JwtEncoder jwtEncoder,
                          UserProfileConverter userProfileConverter,
                          UserConverter userConverter) {
        this.userService = userService;
        this.jwtEncoder = jwtEncoder;
        this.userProfileConverter = userProfileConverter;
        this.userConverter = userConverter;
    }


    @PreAuthorize("@securityUtils.hasAuthorityToRequestedOrgId('OP_READ_DOCUMENT') " +
            "|| @securityUtils.hasAuthorityToRequestedProjectId()")
    @GetMapping("/users")
    @Operation(summary = "Get all users",
            description = "Retrieve a list of all users based on the provided criteria.")
    public Page<User> getAllUsers(@Valid UserCriteria criteria, Pageable pageable) throws Exception {

        // run code to get the user from the database
        return userService.getAllUsers(criteria, pageable);
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
    public UserProfile getUserUserProfile(@PathVariable UUID id, Authentication authentication) throws Exception {

        // run code to get the user from the database
        User user = userService.getById(id);
        UserProfile userProfile = userProfileConverter.toDTO(user);

        return userProfile;
    }

    // TODO this is just for demo purposes, need to be rewrite
    @GetMapping("/users/login")
    @Operation(summary = "Get user by email",
            description = "Retrieve user information based on their email address. " +
                    "This method decodes the user's JWT based on the provided email " +
                    "and returns a JWTResponse containing the user's JWT token.")
    @Observed(name = "user.login",
            contextualName = "user-login-method",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
            })
    public JwtResponse getUserByLogin(@RequestParam("email") String email) throws Exception {

        // run code to get the user from the database
        JwtClaimsSet claims = userService.getJwtClaims(email);

        String jwt = jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
        return new JwtResponse(jwt);
    }

    @PostMapping(value = "/users", consumes = {"application/json"})
    @ResponseStatus(value = HttpStatus.CREATED)
    public User createUser(@RequestBody UserDTO userDTO) throws GendoxException{
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


    record JwtResponse(String token) {
    }

}
