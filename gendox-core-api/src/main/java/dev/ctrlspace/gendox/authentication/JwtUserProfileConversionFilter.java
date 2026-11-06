package dev.ctrlspace.gendox.authentication;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.JwtDTOUserProfileConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.SneakyThrows;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.util.stream.Collectors;

@Component
public class JwtUserProfileConversionFilter extends OncePerRequestFilter {

    private UserService userService;
    private JWTUtils jwtUtils;
    private JwtDTOUserProfileConverter jwtDTOUserProfileConverter;
    private String keycloakClientId;


    @Autowired
    public JwtUserProfileConversionFilter(UserService userService, JwtDTOUserProfileConverter jwtDTOUserProfileConverter, JWTUtils jwtUtils,
                                          @Value("${keycloak.client-id}") String keycloakClientId) {
        this.userService = userService;
        this.jwtDTOUserProfileConverter = jwtDTOUserProfileConverter;
        this.jwtUtils = jwtUtils;
        this.keycloakClientId = keycloakClientId;
    }


    @SneakyThrows
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) {

        if (SecurityContextHolder.getContext().getAuthentication() instanceof JwtAuthenticationToken) {
            JwtAuthenticationToken jwtAuth = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
            Jwt jwt = (Jwt) jwtAuth.getPrincipal();

            // Extract additional information to populate CustomUserDetails
            String email = jwt.getClaimAsString("preferred_username");
            if (email == null || email.isBlank()) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "JWT preferred_username is required");
                return;
            }
            UserProfile userProfile = userService.getUserProfileByUniqueIdentifier(email);
            if (!isTokenOfProfile(jwt, userProfile)) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "JWT subject does not match the user profile");
                return;
            }
            JwtDTO jwtDTO = jwtDTOUserProfileConverter.jwtDTO(userProfile);
            var authorities = jwtUtils.getAuthorities(jwtDTO).stream().map(SimpleGrantedAuthority::new).collect(Collectors.toList());


            GendoxAuthenticationToken gendoxAuthenticationToken = new GendoxAuthenticationToken(userProfile, jwt, authorities);
            SecurityContextHolder.getContext().setAuthentication(gendoxAuthenticationToken);
        }

        filterChain.doFilter(request, response);
    }

    /**
     * The username of a token can be chosen by its owner, so it is not enough to prove that the profile found by it is theirs.
     */
    private boolean isTokenOfProfile(Jwt jwt, UserProfile userProfile) {
        return jwt.getSubject().equals(userProfile.getId())
                // Discord users: only the backend has the secret of this client, to get a token on their behalf
                || keycloakClientId.equals(jwt.getClaimAsString("azp"))
                // Accounts not created by their first login, like seeded ones: Keycloak verified that this email is theirs
                || (Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified"))
                    && userProfile.getEmail() != null
                    && userProfile.getEmail().equalsIgnoreCase(jwt.getClaimAsString("email")));
    }
}
