package dev.ctrlspace.gendox.authentication;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import lombok.SneakyThrows;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Filter to register a user if it does not exist in the database
 * Pre-requisites:
 * 1. user has been logged  in the Identity Provider
 * 2. user's JWT has been verified by Spring Security
 * 3. it is the first time the user access Gendox with a valid JWT
 *
 */
@Component
public class JwtUserRegistrationFilter extends OncePerRequestFilter {

    private final UserService userService;
    private final OrganizationService organizationService;
    private final ProjectService projectService;

    @Autowired
    public JwtUserRegistrationFilter(UserService userService,
                                     OrganizationService organizationService,
                                     ProjectService projectService) {
        this.userService = userService;
        this.organizationService = organizationService;
        this.projectService = projectService;
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
                User user = new User();
                user.setEmail(email);
                user = userService.createUser(user);
                // create default Organization and Project
                // TODO this should be removed from here User should decide the org name
                Organization organization = new Organization();
                organization.setName("Organization - " + user.getEmail());

                organization = organizationService.createOrganization(organization, user.getId());

                ProjectDTO projectDTO = new ProjectDTO();
                projectDTO.setName("Project - " + user.getEmail());
                projectDTO.setOrganizationId(organization.getId());

                projectService.createProject(projectDTO, user.getId().toString());
            }
        }

        filterChain.doFilter(request, response);
    }
}
