package dev.ctrlspace.gendox.authentication;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.JwtDTOUserProfileConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ApiKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ApiKeyService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.CredentialsExpiredException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.stream.Collectors;

@Component
public class ApiKeyAuthenticationProvider implements AuthenticationProvider {

    private final Logger logger = org.slf4j.LoggerFactory.getLogger(ApiKeyAuthenticationProvider.class);

    @Autowired
    private UserService userService;

    @Autowired
    private ApiKeyService apiKeyService;

    @Autowired
    private OrganizationService organizationService;

    @Autowired
    private JWTUtils jwtUtils;
    @Autowired
    private JwtDTOUserProfileConverter jwtDTOUserProfileConverter;

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        if (!(authentication instanceof ApiKeyAuthenticationToken)) {
            return null;
        }

        String apiKey = (String) authentication.getCredentials();
        UserProfile userProfile = null;

        ApiKey apiKeyObj = null;
        try {
            apiKeyObj = apiKeyService.getOrganizationId(apiKey);
        } catch (GendoxException e) {
            throw new BadCredentialsException("Invalid API Key", e);
        }
        Instant now = Instant.now();
        if (!apiKeyObj.isActive()){
            logger.error("API Key is not active.");
            throw new BadCredentialsException("Invalid API Key");
        }

        if (!(apiKeyObj.getStartDate().isBefore(now) && apiKeyObj.getEndDate().isAfter(now))) {
            logger.error("API Key expired.");
            throw new CredentialsExpiredException("API key expired");
        }

        try {
//            userProfile = userService.getUserProfileByUniqueIdentifier(email);
            userProfile = organizationService.getOrganizationProfileById(apiKeyObj.getOrganizationId(), "ROLE_ADMIN");
        } catch (GendoxException e) {
            throw new UsernameNotFoundException("API key not found.");
        }
        JwtDTO jwtDTO = jwtDTOUserProfileConverter.jwtDTO(userProfile);
        var authorities = jwtUtils.getAuthorities(jwtDTO).stream().map(SimpleGrantedAuthority::new).collect(Collectors.toList());

        ApiKeyAuthenticationToken gendoxAuthenticationToken = new ApiKeyAuthenticationToken(userProfile, null, authorities);

        return gendoxAuthenticationToken;

    }

    @Override
    public boolean supports(Class<?> authentication) {
        return ApiKeyAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
