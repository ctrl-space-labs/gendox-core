package dev.ctrlspace.gendox.gendoxcoreapi.security;

import dev.ctrlspace.gendox.authentication.*;
import dev.ctrlspace.gendox.gendoxcoreapi.configuration.SecurityConfiguration;
import dev.ctrlspace.gendox.gendoxcoreapi.controller.InvitationController;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.JwtDTOUserProfileConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Invitation;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.*;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import java.util.List;
import java.util.UUID;
import static org.mockito.Mockito.mock;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringJUnitConfig(ManagementSecurityTest.Config.class)
@WebAppConfiguration
@TestPropertySource(properties = {
        "rsa.private-key=unused",
        "walt-id.default-key.size=256",
        "spring.security.oauth2.resourceserver.jwt.jwk-set-uri=https://issuer.example/realm/certs"
})
class ManagementSecurityTest {
    @Configuration @EnableWebSecurity @EnableWebMvc @Import(SecurityConfiguration.class)
    static class Config {
        @Bean UserService users() { return mock(UserService.class); }
        @Bean OrganizationService organizations() { return mock(OrganizationService.class); }
        @Bean ApiKeyService apiKeys() { return mock(ApiKeyService.class); }
        @Bean JWTUtils jwtUtils() { return mock(JWTUtils.class); }
        @Bean JwtDTOUserProfileConverter jwtConverter() { return mock(JwtDTOUserProfileConverter.class); }
        @Bean ApiKeyAuthenticationProvider apiKeyProvider() { return mock(ApiKeyAuthenticationProvider.class); }
        @Bean ApiKeyAuthenticationFilter apiKeyFilter() { return new ApiKeyAuthenticationFilter(mock(AuthenticationManager.class)); }
        @Bean JwtUserRegistrationFilter registrationFilter() {
            return new JwtUserRegistrationFilter(mock(UserService.class), mock(OrganizationService.class),
                    mock(ProjectService.class), mock(UserInvitationService.class));
        }
        @Bean JwtUserProfileConversionFilter conversionFilter() {
            return new JwtUserProfileConversionFilter(mock(UserService.class), mock(JwtDTOUserProfileConverter.class), mock(JWTUtils.class), "backend-client");
        }
        @Bean(name = "delegatedAuthenticationEntryPoint") AuthenticationEntryPoint entryPoint() {
            return (request, response, exception) -> response.sendError(401);
        }
        @Bean InvitationController invitationController() throws Exception {
            Type pending = new Type(); pending.setName("PENDING");
            Invitation invitation = new Invitation(); invitation.setStatusType(pending);
            invitation.setExpiresAt(java.time.Instant.now().plusSeconds(600));
            UserInvitationService invitations = mock(UserInvitationService.class);
            org.mockito.Mockito.when(invitations.getByInviteeEmailAndToken("invitee@example.invalid", "invitation-token")).thenReturn(invitation);
            return new InvitationController(invitations, mock(SubscriptionValidationService.class),
                    mock(ProjectService.class), mock(UserOrganizationService.class), mock(SecurityUtils.class));
        }
        @Bean ManagementProbe probe() { return new ManagementProbe(); }
    }
    @RestController static class ManagementProbe {
        @GetMapping({"/actuator/health", "/actuator/health/liveness", "/actuator/health/readiness",
                "/actuator/prometheus", "/actuator/beans"}) String endpoint() { return "probe"; }
    }
    @Autowired WebApplicationContext context;
    MockMvc mvc;
    @BeforeEach void setup() { mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build(); }

    GendoxAuthenticationToken token(String role) {
        Type type = new Type(); type.setName(role);
        return new GendoxAuthenticationToken(UserProfile.builder().id(UUID.randomUUID().toString())
                .globalUserRoleType(type).organizations(List.of()).build(), null, List.of());
    }
    // Which actuator endpoints exist is limited in application.yml (management.endpoints.web.exposure)
    @Test void healthRemainsPublic() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
        mvc.perform(get("/actuator/health/liveness")).andExpect(status().isOk());
        mvc.perform(get("/actuator/health/readiness")).andExpect(status().isOk());
    }
    @Test void managementMetricsRequireAnOperatorRatherThanAnOrganizationUserOrApiKey() throws Exception {
        for (String endpoint : List.of("/actuator/prometheus", "/actuator/beans")) {
            mvc.perform(get(endpoint)).andExpect(status().isUnauthorized());
            mvc.perform(get(endpoint).with(authentication(token("GENDOX_USER")))).andExpect(status().isForbidden());
            mvc.perform(get(endpoint).with(authentication(token("GENDOX_API_KEY")))).andExpect(status().isForbidden());
            mvc.perform(get(endpoint).with(authentication(token("GENDOX_SUPER_ADMIN")))).andExpect(status().isOk());
        }
    }
    @Test void invitationAcceptanceRemainsPublicWithoutAuthentication() throws Exception {
        mvc.perform(get("/invitations/acceptance").param("email", "invitee@example.invalid").param("token", "invitation-token"))
                .andExpect(status().isOk());
    }

}
