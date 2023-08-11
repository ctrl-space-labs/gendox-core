package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class JWTUtilsTest {

    //test for toJwtDTO
    @InjectMocks
    private JWTUtils jwtUtils;

    @Mock
    private JwtDecoder jwtDecoder;


    private String validToken;
    private String tokenPayload;


    /**
     * Test for toJwtDTO
     */
    @Test
    public void testToJwtDTO_validJWT() throws Exception {
        when(jwtDecoder.decode(anyString())).thenReturn(decodeJwtForTesting(validToken));
        JwtDTO jwt = jwtUtils.toJwtDTO(validToken);

        assertEquals("csekas@test.com", jwt.getEmail());
        assertEquals("google-oauth2|60b0a0b0b0b0b0b0b0b0b0b0", jwt.getSub());
        assertEquals(2, jwt.getAud().size());
        assertEquals("https://gendox-api.ctrlspace.dev", jwt.getAud().get(0));
        assertEquals("376cc7cb-2df8-4f31-8fcc-11e709c5bf8a", jwt.getUserId().toString());
        assertEquals(2, jwt.getOrgAuthoritiesMap().size());
        JwtDTO.OrganizationAuthorities firstOrgAuth = jwt.getOrgAuthoritiesMap().get("b3cea61b-3339-4386-b228-921be60ee754");
        assertEquals(8, firstOrgAuth.orgAuthorities().size());
        assertTrue(firstOrgAuth.orgAuthorities().contains("ROLE_USER"));
        assertTrue(firstOrgAuth.orgAuthorities().contains("ROLE_ADMIN"));
        assertFalse(firstOrgAuth.orgAuthorities().contains("ROLE_READER"));

        JwtDTO.OrganizationAuthorities secondOrgAuth = jwt.getOrgAuthoritiesMap().get("59326c6a-990f-400e-bdb9-0a3ca0b47a60");
        assertEquals(3, secondOrgAuth.orgAuthorities().size());
        assertTrue(secondOrgAuth.orgAuthorities().contains("ROLE_USER"));
        assertTrue(secondOrgAuth.orgAuthorities().contains("ROLE_READER"));
        assertFalse(secondOrgAuth.orgAuthorities().contains("ROLE_ADMIN"));


    }


    @BeforeEach
    public void setUp() {
        validToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik1UaEVOVUpHTkVNMVFURTRNMEZCTWpkQ05UZzVNRFUxUlRVd1FVSkRNRU13UmtGRVFrRXpSZyJ9" +
                ".ewogICAgICAgICAgICAgICAgICAiaXNzIjogImh0dHBzOi8vZGV2LWN0cmxzcGFjZS5ldS5hdXRoMC5jb20vIiwKICAgICAgICAgICAgICAgICAgInN1YiI6ICJnb29nbGUtb2F1dGgyfDYwYjBhMGIwYjBiMGIwYjBiMGIwYjBiMCIsCiAgICAgICAgICAgICAgICAgICJhdWQiOiBbCiAgICAgICAgICAgICAgICAgICAgImh0dHBzOi8vZ2VuZG94LWFwaS5jdHJsc3BhY2UuZGV2IiwKICAgICAgICAgICAgICAgICAgICAiaHR0cHM6Ly9kZXYtY3RybHNwYWNlLmV1LmF1dGgwLmNvbS91c2VyaW5mbyIKICAgICAgICAgICAgICAgICAgXSwKICAgICAgICAgICAgICAgICAgImlhdCI6IDE2MjIyMTIzNDUsCiAgICAgICAgICAgICAgICAgICJleHAiOiAxNjIyMjk4NzQ1LAogICAgICAgICAgICAgICAgICAic2NvcGUiOiAib3BlbmlkIHByb2ZpbGUgZW1haWwiLAogICAgICAgICAgICAgICAgICAidXNlcl9pZCI6ICIzNzZjYzdjYi0yZGY4LTRmMzEtOGZjYy0xMWU3MDljNWJmOGEiLAogICAgICAgICAgICAgICAgICAiZW1haWwiOiAiY3Nla2FzQHRlc3QuY29tIiwKICAgICAgICAgICAgICAgICAgIm9yZ0F1dGhvcml0aWVzIjogWwogICAgICAgICAgICAgICAgICAgICJiM2NlYTYxYi0zMzM5LTQzODYtYjIyOC05MjFiZTYwZWU3NTQ6Uk9MRV9VU0VSIiwKICAgICAgICAgICAgICAgICAgICAiYjNjZWE2MWItMzMzOS00Mzg2LWIyMjgtOTIxYmU2MGVlNzU0OlJPTEVfQURNSU4iLAogICAgICAgICAgICAgICAgICAgICJiM2NlYTYxYi0zMzM5LTQzODYtYjIyOC05MjFiZTYwZWU3NTQ6T1BfUkVBRF9ET0NVTUVOVCIsCiAgICAgICAgICAgICAgICAgICAgImIzY2VhNjFiLTMzMzktNDM4Ni1iMjI4LTkyMWJlNjBlZTc1NDpPUF9XUklURV9ET0NVTUVOVCIsCiAgICAgICAgICAgICAgICAgICAgImIzY2VhNjFiLTMzMzktNDM4Ni1iMjI4LTkyMWJlNjBlZTc1NDpPUF9BRERfVVNFUlMiLAogICAgICAgICAgICAgICAgICAgICJiM2NlYTYxYi0zMzM5LTQzODYtYjIyOC05MjFiZTYwZWU3NTQ6T1BfUkVNT1ZFX1VTRVJTIiwKICAgICAgICAgICAgICAgICAgICAiYjNjZWE2MWItMzMzOS00Mzg2LWIyMjgtOTIxYmU2MGVlNzU0Ok9QX0RFTEVURV9PUkdBTklaQVRJT04iLAogICAgICAgICAgICAgICAgICAgICJiM2NlYTYxYi0zMzM5LTQzODYtYjIyOC05MjFiZTYwZWU3NTQ6T1BfRURJVF9QUk9KRUNUX1NFVFRJTkdTIiwKICAgICAgICAgICAgICAgICAgICAiNTkzMjZjNmEtOTkwZi00MDBlLWJkYjktMGEzY2EwYjQ3YTYwOlJPTEVfVVNFUiIsCiAgICAgICAgICAgICAgICAgICAgIjU5MzI2YzZhLTk5MGYtNDAwZS1iZGI5LTBhM2NhMGI0N2E2MDpST0xFX1JFQURFUiIsCiAgICAgICAgICAgICAgICAgICAgIjU5MzI2YzZhLTk5MGYtNDAwZS1iZGI5LTBhM2NhMGI0N2E2MDpPUF9SRUFEX0RPQ1VNRU5UIgogICAgICAgICAgICAgICAgICBdCiAgICAgICAgICAgICAgICB9" +
                ".O9IaKNgiKIBksoHlV23zpIWhWC29y0IeFc3bYK6cOJhdogz_YpmMD0YuYKs2tDThwXUC92FGU0P1lLRrbAenym_-GQ3r64OB_QDrAC5R6xjeMmllPRCuRo6XMJofn2rC2Otb3iVDJOI44vhQr1MOMnAhyl6F1FvKYQvlYJtjLXFLJVA-nhYlglQz_6OOIjfFACfyLPE5AW74-Z67DMDhm1130_ARYXSX3dnECEdIYrFzBeiP2XROnUv9gHR0N9j5v_p5sx0TYitEArQuDlDWlxh-V4Y6hKYE-nGj2JV1CgaJGqBzTgG0u3cEkux3Fk8tPS4l_bA1BmwTnXj0BNEsGw";
        tokenPayload = """
                {
                  "iss": "https://dev-ctrlspace.eu.auth0.com/",
                  "sub": "google-oauth2|60b0a0b0b0b0b0b0b0b0b0b0",
                  "aud": [
                    "https://gendox-api.ctrlspace.dev",
                    "https://dev-ctrlspace.eu.auth0.com/userinfo"
                  ],
                  "iat": 1622212345,
                  "exp": 1622298745,
                  "scope": "openid profile email",
                  "user_id": "376cc7cb-2df8-4f31-8fcc-11e709c5bf8a",
                  "email": "csekas@test.com",
                  "orgAuthorities": [
                    "b3cea61b-3339-4386-b228-921be60ee754:ROLE_USER",
                    "b3cea61b-3339-4386-b228-921be60ee754:ROLE_ADMIN",
                    "b3cea61b-3339-4386-b228-921be60ee754:OP_READ_DOCUMENT",
                    "b3cea61b-3339-4386-b228-921be60ee754:OP_WRITE_DOCUMENT",
                    "b3cea61b-3339-4386-b228-921be60ee754:OP_ADD_USERS",
                    "b3cea61b-3339-4386-b228-921be60ee754:OP_REMOVE_USERS",
                    "b3cea61b-3339-4386-b228-921be60ee754:OP_DELETE_ORGANIZATION",
                    "b3cea61b-3339-4386-b228-921be60ee754:OP_EDIT_PROJECT_SETTINGS",
                    "59326c6a-990f-400e-bdb9-0a3ca0b47a60:ROLE_USER",
                    "59326c6a-990f-400e-bdb9-0a3ca0b47a60:ROLE_READER",
                    "59326c6a-990f-400e-bdb9-0a3ca0b47a60:OP_READ_DOCUMENT"
                  ]
                }
                """;

    }

    public Jwt decodeJwtForTesting(String jwtString) throws Exception {
        String[] segments = jwtString.split("\\.");

        if (segments.length != 3) {
            throw new IllegalArgumentException("Invalid JWT format");
        }

        String header = new String(Base64.getUrlDecoder().decode(segments[0]), StandardCharsets.UTF_8);
        String payload = new String(Base64.getUrlDecoder().decode(segments[1]), StandardCharsets.UTF_8);

        ObjectMapper objectMapper = new ObjectMapper();

        Map<String, Object> headerMap = objectMapper.readValue(header, Map.class);
        Map<String, Object> claimsMap = objectMapper.readValue(payload, Map.class);

        return new Jwt(jwtString, Instant.ofEpochSecond(Long.valueOf( (Integer) claimsMap.get("iat"))), Instant.ofEpochSecond(Long.valueOf( (Integer) claimsMap.get("exp"))), headerMap, claimsMap);
    }
}
