package dev.ctrlspace.gendox.authentication;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Invitation;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.InvitationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserInvitationService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.SneakyThrows;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
    public JwtUserRegistrationFilter(UserService userService,
                                     OrganizationService organizationService,
                                     ProjectService projectService,
                                     UserInvitationService userInvitationService) {
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

            String email = jwt.getClaimAsString("preferred_username");
            Optional<User> userOptional = userService.getOptionalUserByUniqueIdentifier(email);
            // first login, create user
            if (userOptional.isEmpty()) {
                logger.info("User with email {} not found in the database, registering a new user!", email);
                User user = new User();
                user.setId(UUID.fromString(jwt.getClaim("sub")));
                user.setFirstName(jwt.getClaimAsString("given_name"));
                user.setLastName(jwt.getClaimAsString("family_name"));
                user.setName(user.getFirstName() + " " + user.getLastName());
                user.setEmail(email);
                user.setUserName(email);
                user = userService.createUser(user);

                Page<Invitation> invitations = userInvitationService.getInvitationsByCriteria(
                        InvitationCriteria
                                .builder()
                                .email(email)
                                .statusName("ACCEPTED")
                                .build(),
                        PageRequest.of(0, 100));

                if (invitations.hasContent()) {
                    for (Invitation invitation : invitations.getContent()) {
                        userInvitationService.acceptInvitation(email, invitation.getToken());
                    }
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
