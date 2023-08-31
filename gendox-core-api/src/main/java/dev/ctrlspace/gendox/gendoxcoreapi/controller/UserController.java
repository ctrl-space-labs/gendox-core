package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.UserCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
public class UserController {


    Logger logger = LoggerFactory.getLogger(UserController.class);


    //    @Autowired
    private UserService userService;
    private JwtEncoder jwtEncoder;

    @Autowired
    public UserController(UserService userService,
                          JwtEncoder jwtEncoder) {
        this.userService = userService;
        this.jwtEncoder = jwtEncoder;
    }


    @PreAuthorize("@securityUtils.hasAuthorityToRequestedOrgId('OP_READ_DOCUMENT') " +
            "|| @securityUtils.hasAuthorityToRequestedProjectId()")
    @GetMapping("/users")
    public Page<User> getAllUsers(@Valid UserCriteria criteria, Pageable pageable) throws Exception {

        // run code to get the user from the database
        return userService.getAllUsers(criteria, pageable);
    }


    // TODO add authorization check if the user belongs to the same organization
    @GetMapping("/users/{id}")
    public User getUserById(@PathVariable UUID id, Authentication authentication) throws Exception {

        // run code to get the user from the database
        User user = userService.getById(id);

        return user;
    }

    // TODO this is just for demo purposes, need to be rewrite
    @GetMapping("/users/login")
    public JwtResponse getUserByLogin(@RequestParam("email") String email ) throws Exception {

        // run code to get the user from the database
        JwtClaimsSet claims = userService.getJwtClaims(email);

        String jwt = jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
        return new JwtResponse(jwt);
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
