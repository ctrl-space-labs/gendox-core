package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import com.nimbusds.jwt.JWTClaimsSet;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.UserCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class UserController {


    Logger logger = LoggerFactory.getLogger(UserController.class);


    //    @Autowired
    private UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }


//    @GetMapping("/users")
//    public List<User> getAllUsers(UserCriteria userCriteria) throws Exception {
//
//        // run code to get the user from the database
//        return userService.getAllUsers();
//    }


    @GetMapping("/users/{id}")
    public User getUserById(@PathVariable UUID id, Authentication authentication) throws Exception {

        // run code to get the user from the database
        User user = userService.getById(id);

        return user;
    }

    @GetMapping("/users/login")
    public JwtClaimsSet getUserByLogin() throws Exception {

        // run code to get the user from the database
        JwtClaimsSet jwt = userService.getJwtClaims("csekas@test.com");

        return jwt;
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


}
