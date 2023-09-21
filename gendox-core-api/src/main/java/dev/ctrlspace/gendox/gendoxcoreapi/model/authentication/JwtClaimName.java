package dev.ctrlspace.gendox.gendoxcoreapi.model.authentication;

public class JwtClaimName {

    /**
     * The "iss" (issuer) claim identifies the principal that issued the JWT.
     */
    public static final String ISSUER = "iss";

    /**
     * The "sub" (subject) claim identifies the principal that is the subject of the JWT.
     */
    public static final String SUBJECT = "sub";

    /**
     * The "aud" (audience) claim identifies the recipients that the JWT is intended for.
     */
    public static final String AUDIENCE = "aud";

    /**
     * The "exp" (expiration time) claim identifies the expiration time on or after which the JWT MUST NOT be
     * accepted for processing.
     */
    public static final String EXPIRES_AT = "exp";

    /**
     * The "nbf" (not before) claim identifies the time before which the JWT MUST NOT be accepted for processing.
     */
    public static final String NOT_BEFORE = "nbf";

    /**
     * The "iat" (issued at) claim identifies the time at which the JWT was issued.
     */
    public static final String ISSUED_AT = "iat";

    /**
     * The "jti" (JWT ID) claim provides a unique identifier for the JWT.
     */
    public static final String JWT_ID = "jti";

    /**
     * The "user_id" claim identifies the user.
     */
    public static final String USER_ID = "user_id";

    /**
     * The "email" claim identifies the user.
     */
    public static final String EMAIL = "email";

    /**
     * The "global_role" claim identifies the user.
     */
    public static final String GLOBAL_ROLE = "global_role";

    /**
     * The "scope" claim identifies the user.
     */
    public static final String SCOPE = "scope";

    /**
     * The "projects:organization" claim identifies the user.
     */
    public static final String PROJECTS_ORGANIZATION = "projects:organization";

}
