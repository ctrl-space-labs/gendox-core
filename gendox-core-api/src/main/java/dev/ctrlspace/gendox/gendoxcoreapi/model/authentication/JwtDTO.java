package dev.ctrlspace.gendox.gendoxcoreapi.model.authentication;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

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

    private String userId;
    private String email;
    private String globalRole;

    // OrganizationId -> Authorities
    private Map<String, OrganizationAuthorities> orgAuthoritiesMap;
    private Map<String, OrganizationProject> orgProjectsMap;
    private Map<String, Object> originalClaims;
    private Map<String, Object> originalHeaders;




    public record OrganizationAuthorities(Set<String> orgAuthorities) {
    }
    public record OrganizationProject(Set<String> projectIds) {
    }



}
