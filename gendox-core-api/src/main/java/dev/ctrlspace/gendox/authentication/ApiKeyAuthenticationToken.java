package dev.ctrlspace.gendox.authentication;

import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

public class ApiKeyAuthenticationToken extends AbstractAuthenticationToken {
    private final String apiKey;
    private UserProfile userProfile;

    public ApiKeyAuthenticationToken(UserProfile userProfile, String apiKey, Collection<? extends GrantedAuthority> authorities) {
        super(authorities);
        this.userProfile = userProfile;
        this.apiKey = apiKey;
        setAuthenticated(false);
        if (authorities != null) {
            setAuthenticated(true);
        }

    }

    public String getApiKey() {
        return apiKey;
    }

    @Override
    public Object getCredentials() {
        return apiKey;
    }

    @Override
    public Object getPrincipal() {
        return userProfile; // or return a principal if available
    }
}

