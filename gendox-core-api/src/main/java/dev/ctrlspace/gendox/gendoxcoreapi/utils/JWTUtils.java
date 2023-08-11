package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.JWT;
import com.nimbusds.jwt.SignedJWT;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.RegisteredJwtClaimName;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Component;

import java.text.ParseException;
import java.util.Arrays;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Component
public class JWTUtils {
    private Logger logger = LoggerFactory.getLogger(JWTUtils.class);

    @Autowired
    private JwtDecoder jwtDecoder;

    @Autowired
    private JwtEncoder jwtEncoder;

    public JwtDTO toJwtDTO(String jwtString) {
        Jwt jwt = jwtDecoder.decode(jwtString);
        return toJwtDTO(jwt);
    }
    public JwtDTO toJwtDTO(Jwt jwt) {
        //implement the commented constructor in JwtDTO class
        return JwtDTO.builder()
                .originalClaims(jwt.getClaims())
                .originalHeaders(jwt.getHeaders())
                .iss(jwt.getClaimAsString("iss"))
                .sub(jwt.getClaimAsString("sub"))
                .aud(jwt.getAudience())
                .exp(jwt.getExpiresAt())
                .nbf(jwt.getNotBefore())
                .iat(jwt.getIssuedAt())
                .jti(jwt.getClaimAsString(RegisteredJwtClaimName.JWT_ID))
                .userId(jwt.getClaimAsString("user_id"))
                .email(jwt.getClaimAsString("email"))
                .globalRole(jwt.getClaimAsString("global_role"))
                .orgAuthoritiesMap(
                        jwt.getClaimAsStringList("scope").stream()
                                .map(s -> s.split(":"))
                                .filter(outGlobalRole())
                                .collect(Collectors.toMap(
                                        s -> s[1],
                                        s -> new JwtDTO.OrganizationAuthorities(new HashSet<>(Arrays.asList(s[0]))),
                                        (orgAuth1, orgAuth2) -> {
                                            orgAuth1.orgAuthorities().addAll(orgAuth2.orgAuthorities());
                                            return orgAuth1;
                                        }))
                )
                .orgProjectsMap(
                        jwt.getClaimAsStringList("projects:organization").stream()
                                .map(s -> s.split(":"))
                                .collect(Collectors.toMap(
                                        s -> s[1],
                                        s -> new JwtDTO.OrganizationProject(new HashSet<>(Arrays.asList(s[0]))),
                                        (orgProj1, orgProj2) -> {
                                            orgProj1.projectIds().addAll(orgProj2.projectIds());
                                            return orgProj1;
                                        }))
                )
                .build();
    }

    private static Predicate<String[]> outGlobalRole() {
        return s -> !s[1].equals("GLOBAL_ROLE");
    }

//    public JWTClaimsSet toClaims(String jwtString) throws JOSEException, ParseException {
//        JWT jwt = SignedJWT.parse(jwtString);
//        return jwt.getJWTClaimsSet();
//    }

    public JwtClaimsSet toClaimsSet(JwtDTO jwtDTO) {
        return JwtClaimsSet.builder()
                .issuer(jwtDTO.getIss())
                .subject(jwtDTO.getSub())
                .audience(jwtDTO.getAud())
                .expiresAt(jwtDTO.getExp())
                .notBefore(jwtDTO.getNbf())
                .issuedAt(jwtDTO.getIat())
                .id(jwtDTO.getJti())
                .claim("user_id", jwtDTO.getUserId().toString())
                .claim("email", jwtDTO.getEmail())
                .claim("global_role", jwtDTO.getGlobalRole())
                .claim("scope", getAuthorities(jwtDTO))
                .claim("projects:organization", jwtDTO.getOrgProjectsMap().entrySet().stream()
                        .flatMap(entry -> entry.getValue().projectIds().stream().map(s -> s + ":" + entry.getKey().toString()))
                        .collect(Collectors.toList()))
                .build();

    }

    private List<String> getAuthorities(JwtDTO jwtDTO) {
        List<String> authoritiesMap = jwtDTO.getOrgAuthoritiesMap().entrySet().stream()
                .flatMap(entry -> entry.getValue().orgAuthorities().stream().map(s -> s + ":" + entry.getKey().toString()))
                .collect(Collectors.toList());

        authoritiesMap.add(jwtDTO.getGlobalRole() + ":GLOBAL_ROLE");
        return authoritiesMap;
    }

    public String toJwtString(JwtDTO jwtDTO) {
        var claims = toClaimsSet(jwtDTO);
        return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }

    private boolean verifyJWTSignature(String jwtString, RSAKey rsaKey) throws JOSEException, ParseException {
        SignedJWT jwt = SignedJWT.parse(jwtString);
        JWSVerifier verifier = new RSASSAVerifier(rsaKey);
        return jwt.verify(verifier);
    }

    // Method to check if token has expired
    private boolean isTokenExpired(Date expirationTime) {
        return expirationTime != null && expirationTime.before(new Date());
    }

    // Method to check if token has been revoked in redis
    private boolean isTokenRevoked(String jwtString) {
        return false;
    }

    // Method to check if token is valid
//    public boolean isTokenValid(String jwtString, RSAKey rsaKey) {
//        JWTClaimsSet claims = null;
//        try {
//            claims = toClaims(jwtString);
//            return verifyJWTSignature(jwtString, rsaKey) &&
//                    !isTokenExpired(claims.getExpirationTime()) &&
//                    !isTokenRevoked(jwtString);
//        } catch (JOSEException | ParseException e) {
//            logger.error("Error while parsing JWT", e);
//            return false;
//        }
//
//    }


    public JWT getJWT(String jwtString) throws JOSEException, ParseException {
        JWT jwt = SignedJWT.parse(jwtString);
        return jwt;
    }

}