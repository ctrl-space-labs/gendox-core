package dev.ctrlspace.gendox.authentication;

import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.Payload;
import com.nimbusds.jwt.JWTParser;
import com.nimbusds.jwt.SignedJWT;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserRepository;
import jakarta.ws.rs.core.Response;
import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.CreatedResponseUtil;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.AccessTokenResponse;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import javax.annotation.Nullable;
import java.text.ParseException;
import java.time.Instant;
import java.util.Arrays;
import java.util.Map;
import java.util.Optional;

@Component
public class KeycloakAuthenticationService implements AuthenticationService {

    private Logger logger = LoggerFactory.getLogger(KeycloakAuthenticationService.class);

    private RestTemplate restTemplate = new RestTemplate();

    private String keycloakServerUrl;

    private String keycloakTokenUrl;

    private String realm;

    private String clientId;

    private String clientSecret;

    private Keycloak keycloakClient;

    private JwtDecoder jwtDecoder;



    public KeycloakAuthenticationService(@Value("${keycloak.base-url}") String keycloakServerUrl,
                                         @Value("${keycloak.token-uri}") String keycloakTokenUrl,
                                         @Value("${keycloak.realm}") String realm,
                                         @Value("${keycloak.client-id}") String clientId,
                                         @Value("${keycloak.client-secret}") String clientSecret,
                                         JwtDecoder jwtDecoder) {

        this.keycloakServerUrl = keycloakServerUrl;
        this.keycloakTokenUrl = keycloakTokenUrl;
        this.realm = realm;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.jwtDecoder = jwtDecoder;

        keycloakClient = KeycloakBuilder.builder()
                .serverUrl(keycloakServerUrl)
                .realm(realm)
                .grantType(OAuth2Constants.CLIENT_CREDENTIALS)
                .clientId(clientId)
                .clientSecret(clientSecret)
                .build();

    }

    public Jwt getClientToken() {
        String jwtString = getClientTokenString();
        Jwt jwt = jwtDecoder.decode(jwtString);
        return jwt;
    }

    @Override
    public String getClientTokenString() {
        String jwtString = keycloakClient.tokenManager().getAccessTokenString();
        return jwtString;
    }

    @Override
    public AccessTokenResponse impersonateUser(String username, @Nullable String scope) {

        AccessTokenResponse clientToken = keycloakClient.tokenManager().getAccessToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("grant_type", OAuth2Constants.TOKEN_EXCHANGE_GRANT_TYPE);
        map.add("client_id", clientId);
        map.add("client_secret", clientSecret);
        map.add("subject_token", clientToken.getToken());
        map.add("requested_subject", username);
        map.add("requested_token_type", OAuth2Constants.ACCESS_TOKEN_TYPE);
        if (scope != null) {
            map.add("scope", scope);
        }

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);


        ResponseEntity<AccessTokenResponse> impersonationToken = restTemplate.postForEntity(
                keycloakTokenUrl,
                request,
                AccessTokenResponse.class);


        return impersonationToken.getBody();

    }

    private void convertTimestampsToInstant(Map<String, Object> claims) {
        convertToInstant(claims, "exp");
        convertToInstant(claims, "iat");
        convertToInstant(claims, "nbf");
    }

    private void convertToInstant(Map<String, Object> claims, String claimKey) {
        if (claims.containsKey(claimKey)) {
            Object timestamp = claims.get(claimKey);
            if (timestamp instanceof Long) {
                Instant instant = Instant.ofEpochSecond((Long) timestamp);
                claims.put(claimKey, instant);
            }
        }
    }

    @Override
    public String createUser(User user, @Nullable String password, Boolean emailVerified, Boolean tempPassword) throws GendoxException {
        String username = user.getEmail();
        if (username == null) {
            username = user.getUserName();
            username = username.replaceAll("\\s+", "");
        }
        UserRepresentation userRepresentation = new UserRepresentation();
        userRepresentation.setUsername(username);
        userRepresentation.setFirstName(user.getFirstName());
        userRepresentation.setLastName(user.getLastName());
        userRepresentation.setEmail(user.getEmail());
        userRepresentation.setEnabled(true);
        userRepresentation.setEmailVerified(emailVerified);
        if (!emailVerified) {
            userRepresentation.setRequiredActions(Arrays.asList("VERIFY_EMAIL"));
        }

        if (password != null) {
            CredentialRepresentation credential = new CredentialRepresentation();
            credential.setTemporary(tempPassword);
            credential.setType(CredentialRepresentation.PASSWORD);
            credential.setValue(password);
            userRepresentation.setCredentials(Arrays.asList(credential));
        }

        Response response = keycloakClient.realm(realm)
                .users()
                .create(userRepresentation);

        if (response.getStatus() != 201) {
            logger.error("Keycloak create user error " + response.getStatusInfo().getReasonPhrase());
            String responseBody = response.readEntity(String.class);
            throw new GendoxException("CREATE_USER_ERROR", "An error occurred while creating user", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        String userId = CreatedResponseUtil.getCreatedId(response);
        UserResource createdUser = keycloakClient.realm(realm).users().get(userId);


        if (!emailVerified) {
            createdUser.sendVerifyEmail();
        }
        if (tempPassword) {
            createdUser.resetPasswordEmail();
        }

        return userId;
    }



    @Override
    public Optional<UserRepresentation> getUsersByUsername(String userName) {
        return keycloakClient.realm(realm)
                .users()
                .searchByUsername(userName, true)
                .stream()
                .findFirst();
    }

    public void deactivateUser(String email) throws GendoxException {
        Optional<UserRepresentation> userOptional = keycloakClient.realm(realm)
                .users()
                .searchByEmail(email, true)
                .stream()
                .findFirst();

        if (userOptional.isPresent()) {
            UserRepresentation user = userOptional.get();
            user.setEnabled(false);
            keycloakClient.realm(realm).users().get(user.getId()).update(user);
        } else {
            throw new GendoxException("USER_NOT_FOUND", "User not found", HttpStatus.NOT_FOUND);
        }
    }




}
