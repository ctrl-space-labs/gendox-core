package dev.ctrlspace.gendox.authentication;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.JwtDTOUserProfileConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import lombok.SneakyThrows;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class GendoxJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private UserService userService;
    private JWTUtils jwtUtils;
    private JwtDTOUserProfileConverter jwtDTOUserProfileConverter;


    @Autowired
    public GendoxJwtAuthenticationConverter(UserService userService, JwtDTOUserProfileConverter jwtDTOUserProfileConverter, JWTUtils jwtUtils) {
        this.userService = userService;
        this.jwtDTOUserProfileConverter = jwtDTOUserProfileConverter;
        this.jwtUtils = jwtUtils;
    }


    @SneakyThrows
    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {

        // Extract additional information to populate CustomUserDetails
        String email = jwt.getClaimAsString("preferred_username");
        UserProfile userProfile = userService.getUserProfileByUniqueIdentifier(email);
        JwtDTO jwtDTO = jwtDTOUserProfileConverter.jwtDTO(userProfile);
        var authorities = jwtUtils.getAuthorities(jwtDTO).stream().map(SimpleGrantedAuthority::new).collect(Collectors.toList());


        return new GendoxAuthenticationToken(userProfile, jwt, authorities);
    }

    @Override
    public <U> Converter<Jwt, U> andThen(Converter<? super AbstractAuthenticationToken, ? extends U> after) {
        return Converter.super.andThen(after);
    }
}
