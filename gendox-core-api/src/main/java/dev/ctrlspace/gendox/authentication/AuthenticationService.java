package dev.ctrlspace.gendox.authentication;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import org.keycloak.representations.AccessTokenResponse;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.security.oauth2.jwt.Jwt;

import javax.annotation.Nullable;
import java.util.Optional;

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
    public String getClientTokenString();
    public Jwt getClientToken();

    public AccessTokenResponse impersonateUser(String username, @Nullable String scope);

    String createUser(User user, @Nullable String password, Boolean emailVerified, Boolean tempPassword) throws GendoxException;

    public Optional<UserRepresentation> getUsersByUsername(String userName);

    public void deactivateUser(String userName) throws GendoxException;

}
