package dev.ctrlspace.gendox.gendoxcoreapi.model.authentication;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * sample JSON JWT
 * {
 *      "iss": "https://dev-ctrlspace.eu.auth0.com/",
 *      "sub": "google-oauth2|60b0a0b0b0b0b0b0b0b0b0b0",
 *      "aud": [
 *          "https://gendox-api.ctrlspace.dev",
 *          "https://dev-ctrlspace.eu.auth0.com/userinfo"
 *      ],
 *      "iat": 1622212345,
 *      "exp": 1622298745,
 *      "scope": "openid profile email",
 *      "user_id": "376cc7cb-2df8-4f31-8fcc-11e709c5bf8a",
 *      "email": "sekas.x@gmail.com",
 *      "orgAuthorities": [
 *          "b3cea61b-3339-4386-b228-921be60ee754:ROLE_USER",
 *          "b3cea61b-3339-4386-b228-921be60ee754:ROLE_ADMIN",
 *          "b3cea61b-3339-4386-b228-921be60ee754:OP_READ_DOCUMENT",
 *          "b3cea61b-3339-4386-b228-921be60ee754:OP_WRITE_DOCUMENT",
 *          "b3cea61b-3339-4386-b228-921be60ee754:OP_ADD_USERS",
 *          "b3cea61b-3339-4386-b228-921be60ee754:OP_REMOVE_USERS",
 *          "b3cea61b-3339-4386-b228-921be60ee754:OP_DELETE_ORGANIZATION",
 *          "b3cea61b-3339-4386-b228-921be60ee754:OP_EDIT_PROJECT_SETTINGS",
 *          "59326c6a-990f-400e-bdb9-0a3ca0b47a60:ROLE_USER",
 *          "59326c6a-990f-400e-bdb9-0a3ca0b47a60:ROLE_READER",
 *          "59326c6a-990f-400e-bdb9-0a3ca0b47a60:OP_READ_DOCUMENT"
 *      ]
 * }
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class JwtDTO {


    /**
     * The "iss" (issuer) claim identifies the principal that issued the JWT
     */
    private String iss;

    /**
     * The "sub" (subject) claim identifies the principal that is the subject of the JWT
     */
    private String sub;

    /**
     * The "aud" (audience) claim identifies the recipients that the JWT is intended for
     */
    private List<String> aud;

    /**
     * The "exp" (expiration time) claim identifies the expiration time on or after which the JWT MUST NOT be accepted for processing
     */
    private Instant exp;
    /**
     * The "nbf" (not before) claim identifies the time before which the JWT MUST NOT be accepted for processing
     */
    private Instant nbf;

    /**
     * The "iat" (issued at) claim identifies the time at which the JWT was issued
     */
    private Instant iat;
    /**
     * The "jti" (JWT ID) claim provides a unique identifier for the JWT
     */
    private String jti;

    private UUID userId;
    private String email;
    private String globalRole;

    // OrganizationId -> Authorities
    private Map<String, OrganizationAuthorities> authoritiesMap;
    private Map<String, Object> originalClaims;
    private Map<String, Object> originalHeaders;




    public record OrganizationAuthorities(Set<String> orgAuthorities) {
    }



}
