package dev.ctrlspace.gendox.authentication;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import org.springframework.security.oauth2.jwt.Jwt;

import javax.annotation.Nullable;

/**
 * Interface for the Authentication Service.
 * This service is used to authenticate users and clients.
 * It is important all different Authentication Services (like Keycloak, LDAP, auth0, etc.) implement this interface.
 * This way, the rest of the application can use the same methods to authenticate users and clients, regardless of the
 * authentication server used.
 *
 */
public interface AuthenticationService {


    /**
     * This method is used to get an access token for the specified Client.
     *
     * @return
     */
    public Jwt getClientToken(String clientId, String clientSecret);

    public Jwt impersonateUser(String username);

    String createUser(User user, @Nullable String password, boolean emailVerified, boolean tempPassword) throws GendoxException;
}
