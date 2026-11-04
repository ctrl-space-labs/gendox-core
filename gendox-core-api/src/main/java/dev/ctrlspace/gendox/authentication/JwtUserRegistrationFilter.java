package dev.ctrlspace.gendox.authentication;

import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserInvitationService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.SneakyThrows;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

/**
 * Filter to register a user if it does not exist in the database
 * Pre-requisites:
 * 1. user has been logged  in the Identity Provider
 * 2. user's JWT has been verified by Spring Security
 * 3. it is the first time the user access Gendox with a valid JWT
 */
@Component
public class JwtUserRegistrationFilter extends OncePerRequestFilter {

    Logger logger = org.slf4j.LoggerFactory.getLogger(JwtUserRegistrationFilter.class);
    private final UserService userService;
    private final OrganizationService organizationService;
    private final ProjectService projectService;
    private final UserInvitationService userInvitationService;

    @Autowired
    public JwtUserRegistrationFilter(UserService userService, OrganizationService organizationService,
                                     ProjectService projectService, UserInvitationService userInvitationService) {
        this.userService = userService;
        this.organizationService = organizationService;
        this.projectService = projectService;
        this.userInvitationService = userInvitationService;
    }

    @SneakyThrows
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() instanceof JwtAuthenticationToken) {
            JwtAuthenticationToken jwtAuth = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
            Jwt jwt = (Jwt) jwtAuth.getPrincipal();

            UUID subject = UUID.fromString(jwt.getSubject());
            Optional<User> userOptional = userService.getOptionalById(subject);
            if (userOptional.isEmpty()) {
                User user = new User();
                user.setId(subject);
                user.setFirstName(jwt.getClaimAsString("given_name"));
                user.setLastName(jwt.getClaimAsString("family_name"));
                user.setName(user.getFirstName() + " " + user.getLastName());
                String email = jwt.getClaimAsString("preferred_username");
                user.setEmail(email);
                user.setUserName(email);
                user = userService.createUser(user);
                userInvitationService.completeAcceptedInvitations(user);
            }
        }

        filterChain.doFilter(request, response);
    }
}
