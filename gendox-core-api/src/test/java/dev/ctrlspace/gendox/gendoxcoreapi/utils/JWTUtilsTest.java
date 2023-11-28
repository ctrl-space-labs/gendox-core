package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtClaimName;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.extension.ExtendWith;
//import org.mockito.InjectMocks;
//import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;

//import static org.junit.jupiter.api.Assertions.assertEquals;
//import static org.junit.jupiter.api.Assertions.assertTrue;

//@ExtendWith(MockitoExtension.class)
public class JWTUtilsTest {

    //test for toJwtDTO
//    @InjectMocks
    private JWTUtils jwtUtils;
    private Jwt validJwt;

    private String validToken;
    private String jwtDTOJsonString;


    /**
     * Test for toJwtDTO
     */
//    @Test
//    public void testToJwtDTO_validJWT() throws Exception {
//
//
//        JwtDTO jwtDTO = jwtUtils.toJwtDTO(validJwt);
//
//        assertEquals("csekas@test.com", jwtDTO.getEmail());
//        assertEquals("f9c4757b-2d6c-4f16-8922-f0346090c840", jwtDTO.getSub());
//        assertEquals(3, jwtDTO.getAud().size());
//        assertEquals("https://auth.gendox.com/", jwtDTO.getAud().get(0));
//        assertEquals("f9c4757b-2d6c-4f16-8922-f0346090c840", jwtDTO.getUserId().toString());
//        assertEquals(1, jwtDTO.getOrgProjectsMap().size());
//        JwtDTO.OrganizationProject firstOrgProject = jwtDTO.getOrgProjectsMap().get("aaefc0d0-2c6b-4384-8af0-da4d2e85a3a1");
//        assertTrue(firstOrgProject.projectIds().contains("eefeaba9-8c08-4651-92dc-3d2b98a6e261"));
//        assertEquals(1, jwtDTO.getOrgAuthoritiesMap().size());
//        JwtDTO.OrganizationAuthorities firstOrgAuth = jwtDTO.getOrgAuthoritiesMap().get("aaefc0d0-2c6b-4384-8af0-da4d2e85a3a1");
//        assertEquals(7, firstOrgAuth.orgAuthorities().size());
//        assertTrue(firstOrgAuth.orgAuthorities().contains("ROLE_ADMIN"));
//        assertTrue(firstOrgAuth.orgAuthorities().contains("ROLE_ADMIN"));
//        assertTrue(firstOrgAuth.orgAuthorities().contains("OP_DELETE_ORGANIZATION"));
//    }
//
////    @Test
//    public void testToClaimsSet_validJWT() throws Exception {
//        ObjectMapper mapper = new ObjectMapper();
//        mapper.registerModule(new JavaTimeModule());
//        JwtDTO jwtDTO = mapper.readValue(jwtDTOJsonString, JwtDTO.class);
//
//        JwtClaimsSet jwtClaimsSet = jwtUtils.toClaimsSet(jwtDTO);
//        assertEquals(12, jwtClaimsSet.getClaims().size());
//        assertEquals("f9c4757b-2d6c-4f16-8922-f0346090c840", jwtClaimsSet.getSubject());
//        assertEquals("f9c4757b-2d6c-4f16-8922-f0346090c840", jwtClaimsSet.getClaims().get(JwtClaimName.USER_ID));
//        assertEquals("csekas@test.com", jwtClaimsSet.getClaims().get(JwtClaimName.EMAIL));
//        assertEquals("https://auth.gendox.com/", jwtClaimsSet.getAudience().get(0));
//        assertEquals("ROLE_USER", jwtClaimsSet.getClaims().get(JwtClaimName.GLOBAL_ROLE));
//        assertEquals("eefeaba9-8c08-4651-92dc-3d2b98a6e261:aaefc0d0-2c6b-4384-8af0-da4d2e85a3a1", ((List<String>) (jwtClaimsSet.getClaims().get(JwtClaimName.PROJECTS_ORGANIZATION))).get(0));
//        assertEquals("https://auth.gendox.com/", jwtClaimsSet.getIssuer().toString());
//        assertEquals(8, ((List<String>) jwtClaimsSet.getClaim(JwtClaimName.SCOPE)).size());
//        assertTrue(((List<String>) jwtClaimsSet.getClaim(JwtClaimName.SCOPE)).stream().anyMatch(s -> s.equals("ROLE_ADMIN:aaefc0d0-2c6b-4384-8af0-da4d2e85a3a1")));
//        assertTrue(((List<String>) jwtClaimsSet.getClaim(JwtClaimName.SCOPE)).stream().anyMatch(s -> s.equals("OP_DELETE_ORGANIZATION:aaefc0d0-2c6b-4384-8af0-da4d2e85a3a1")));
//        assertTrue(((List<String>) jwtClaimsSet.getClaim(JwtClaimName.SCOPE)).stream().anyMatch(s -> s.equals("ROLE_USER:GLOBAL_ROLE")));
//
//
//    }


//    @BeforeEach
    public void setUp() {
        validToken = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJmOWM0NzU3Yi0yZDZjLTRmMTYtODkyMi1mMDM0NjA5MGM4NDAiLCJhdWQiOlsiaHR0cHM6Ly9hdXRoLmdlbmRveC5jb20vIiwiaHR0cHM6Ly9hcGkuZ2VuZG94LmNvbS8iLCJodHRwczovL2FwcC5nZW5kb3guY29tLyJdLCJuYmYiOjE2OTE3NjUxNjcsInVzZXJfaWQiOiJmOWM0NzU3Yi0yZDZjLTRmMTYtODkyMi1mMDM0NjA5MGM4NDAiLCJnbG9iYWxfcm9sZSI6IlJPTEVfVVNFUiIsInNjb3BlIjpbIk9QX1JFQURfRE9DVU1FTlQ6YWFlZmMwZDAtMmM2Yi00Mzg0LThhZjAtZGE0ZDJlODVhM2ExIiwiT1BfRURJVF9QUk9KRUNUX1NFVFRJTkdTOmFhZWZjMGQwLTJjNmItNDM4NC04YWYwLWRhNGQyZTg1YTNhMSIsIk9QX1dSSVRFX0RPQ1VNRU5UOmFhZWZjMGQwLTJjNmItNDM4NC04YWYwLWRhNGQyZTg1YTNhMSIsIk9QX0RFTEVURV9PUkdBTklaQVRJT046YWFlZmMwZDAtMmM2Yi00Mzg0LThhZjAtZGE0ZDJlODVhM2ExIiwiT1BfUkVNT1ZFX1VTRVJTOmFhZWZjMGQwLTJjNmItNDM4NC04YWYwLWRhNGQyZTg1YTNhMSIsIlJPTEVfQURNSU46YWFlZmMwZDAtMmM2Yi00Mzg0LThhZjAtZGE0ZDJlODVhM2ExIiwiT1BfQUREX1VTRVJTOmFhZWZjMGQwLTJjNmItNDM4NC04YWYwLWRhNGQyZTg1YTNhMSIsIlJPTEVfVVNFUjpHTE9CQUxfUk9MRSJdLCJwcm9qZWN0czpvcmdhbml6YXRpb24iOlsiZWVmZWFiYTktOGMwOC00NjUxLTkyZGMtM2QyYjk4YTZlMjYxOmFhZWZjMGQwLTJjNmItNDM4NC04YWYwLWRhNGQyZTg1YTNhMSJdLCJpc3MiOiJodHRwczovL2F1dGguZ2VuZG94LmNvbS8iLCJleHAiOjE2OTE3Njg3NjcsImlhdCI6MTY5MTc2NTE2NywianRpIjoiN2YyMDE5NmQtNWU4MC00NmFmLThkM2UtNjE1NGRmMDdiYTA4IiwiZW1haWwiOiJjc2VrYXNAdGVzdC5jb20ifQ.MOxz91-aNBalfCyFyOpby5tXJW3bIOnNBKa245BFCUEkQPjT0RxeS87Ritxw9E7dur0XmjXvxIk-s6YXKZNtOVUO8z1XMnOd-KGohmHybhS3jX4_bE9za2gprSRUIX9GaciPCjJh4JRoarPRvpQyugOYsDAxtpAgfXjVknkAlsufcXF2umQItM4Mm7T88Z0UccqjAgXhqCEq8oWUvlmdDypjehufjq6CBhM97FeFtIS4sBIxGTql4-UbM0JkWpn5MySrs_FD3-cOk1YJycbXXge59Y1Mqu2AKYsCdbFCsggnJsPDZJagwYyrqE9J6BxxDVh4EqO0sGV8bdCcutxd_g";
        jwtDTOJsonString = "{\"iss\":\"https://auth.gendox.com/\",\"sub\":\"f9c4757b-2d6c-4f16-8922-f0346090c840\",\"aud\":[\"https://auth.gendox.com/\",\"https://api.gendox.com/\",\"https://app.gendox.com/\"],\"exp\":1691768767.000000000,\"nbf\":1691765167.000000000,\"iat\":1691765167.000000000,\"jti\":\"7f20196d-5e80-46af-8d3e-6154df07ba08\",\"userId\":\"f9c4757b-2d6c-4f16-8922-f0346090c840\",\"email\":\"csekas@test.com\",\"globalRole\":\"ROLE_USER\",\"orgAuthoritiesMap\":{\"aaefc0d0-2c6b-4384-8af0-da4d2e85a3a1\":{\"orgAuthorities\":[\"OP_READ_DOCUMENT\",\"OP_EDIT_PROJECT_SETTINGS\",\"OP_WRITE_DOCUMENT\",\"OP_DELETE_ORGANIZATION\",\"OP_REMOVE_USERS\",\"ROLE_ADMIN\",\"OP_ADD_USERS\"]}},\"orgProjectsMap\":{\"aaefc0d0-2c6b-4384-8af0-da4d2e85a3a1\":{\"projectIds\":[\"eefeaba9-8c08-4651-92dc-3d2b98a6e261\"]}},\"originalClaims\":{\"sub\":\"f9c4757b-2d6c-4f16-8922-f0346090c840\",\"aud\":[\"https://auth.gendox.com/\",\"https://api.gendox.com/\",\"https://app.gendox.com/\"],\"nbf\":1691765167.000000000,\"user_id\":\"f9c4757b-2d6c-4f16-8922-f0346090c840\",\"global_role\":\"ROLE_USER\",\"scope\":[\"OP_READ_DOCUMENT:aaefc0d0-2c6b-4384-8af0-da4d2e85a3a1\",\"OP_EDIT_PROJECT_SETTINGS:aaefc0d0-2c6b-4384-8af0-da4d2e85a3a1\",\"OP_WRITE_DOCUMENT:aaefc0d0-2c6b-4384-8af0-da4d2e85a3a1\",\"OP_DELETE_ORGANIZATION:aaefc0d0-2c6b-4384-8af0-da4d2e85a3a1\",\"OP_REMOVE_USERS:aaefc0d0-2c6b-4384-8af0-da4d2e85a3a1\",\"ROLE_ADMIN:aaefc0d0-2c6b-4384-8af0-da4d2e85a3a1\",\"OP_ADD_USERS:aaefc0d0-2c6b-4384-8af0-da4d2e85a3a1\",\"ROLE_USER:GLOBAL_ROLE\"],\"projects:organization\":[\"eefeaba9-8c08-4651-92dc-3d2b98a6e261:aaefc0d0-2c6b-4384-8af0-da4d2e85a3a1\"],\"iss\":\"https://auth.gendox.com/\",\"exp\":1691768767.000000000,\"iat\":1691765167.000000000,\"jti\":\"7f20196d-5e80-46af-8d3e-6154df07ba08\",\"email\":\"csekas@test.com\"},\"originalHeaders\":{\"alg\":\"RS256\"}}";

        validJwt = Jwt.withTokenValue(validToken)
                .header("alg", "RS256")
                .header("typ", "JWT")
                .claim(JwtClaimName.ISSUER, "https://auth.gendox.com/")
                .claim(JwtClaimName.SUBJECT, "f9c4757b-2d6c-4f16-8922-f0346090c840")
                .claim(JwtClaimName.USER_ID, "f9c4757b-2d6c-4f16-8922-f0346090c840")
                .claim(JwtClaimName.EMAIL, "csekas@test.com")
                .claim(JwtClaimName.AUDIENCE, Arrays.asList("https://auth.gendox.com/", "https://api.gendox.com/", "https://app.gendox.com/"))
                .expiresAt(Instant.now().plus(3600 * 24, ChronoUnit.SECONDS))
                .issuedAt(Instant.now())
                .claim(JwtClaimName.JWT_ID, "7f20196d-5e80-46af-8d3e-6154df07ba08")
                .claim(JwtClaimName.GLOBAL_ROLE, "ROLE_USER")
                .claim(JwtClaimName.PROJECTS_ORGANIZATION, Arrays.asList("eefeaba9-8c08-4651-92dc-3d2b98a6e261:aaefc0d0-2c6b-4384-8af0-da4d2e85a3a1"))
                .claim(JwtClaimName.SCOPE, Arrays.asList("OP_READ_DOCUMENT:aaefc0d0-2c6b-4384-8af0-da4d2e85a3a1",
                        "OP_EDIT_PROJECT_SETTINGS:aaefc0d0-2c6b-4384-8af0-da4d2e85a3a1",
                        "OP_WRITE_DOCUMENT:aaefc0d0-2c6b-4384-8af0-da4d2e85a3a1",
                        "OP_DELETE_ORGANIZATION:aaefc0d0-2c6b-4384-8af0-da4d2e85a3a1",
                        "OP_REMOVE_USERS:aaefc0d0-2c6b-4384-8af0-da4d2e85a3a1",
                        "ROLE_ADMIN:aaefc0d0-2c6b-4384-8af0-da4d2e85a3a1",
                        "OP_ADD_USERS:aaefc0d0-2c6b-4384-8af0-da4d2e85a3a1",
                        "ROLE_USER:GLOBAL_ROLE"))
                .build();


    }

}
