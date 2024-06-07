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


    @Autowired
    public JwtUserProfileConversionFilter(UserService userService, JwtDTOUserProfileConverter jwtDTOUserProfileConverter, JWTUtils jwtUtils) {
        this.userService = userService;
        this.jwtDTOUserProfileConverter = jwtDTOUserProfileConverter;
        this.jwtUtils = jwtUtils;
    }


    @SneakyThrows
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) {

        if (SecurityContextHolder.getContext().getAuthentication() instanceof JwtAuthenticationToken) {
            JwtAuthenticationToken jwtAuth = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
            Jwt jwt = (Jwt) jwtAuth.getPrincipal();

            // Extract additional information to populate CustomUserDetails
            String email = jwt.getClaimAsString("preferred_username");
            UserProfile userProfile = userService.getUserProfileByUniqueIdentifier(email);
            JwtDTO jwtDTO = jwtDTOUserProfileConverter.jwtDTO(userProfile);
            var authorities = jwtUtils.getAuthorities(jwtDTO).stream().map(SimpleGrantedAuthority::new).collect(Collectors.toList());


            GendoxAuthenticationToken gendoxAuthenticationToken = new GendoxAuthenticationToken(userProfile, jwt, authorities);
            SecurityContextHolder.getContext().setAuthentication(gendoxAuthenticationToken);
        }

        filterChain.doFilter(request, response);
    }
}
