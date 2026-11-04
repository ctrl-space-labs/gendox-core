package dev.ctrlspace.gendox.gendoxcoreapi.security;

import dev.ctrlspace.gendox.authentication.GendoxAuthenticationToken;
import dev.ctrlspace.gendox.authentication.JwtUserProfileConversionFilter;
import dev.ctrlspace.gendox.authentication.JwtUserRegistrationFilter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.JwtDTOUserProfileConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.*;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class JwtProfileCompatibilitySecurityTest {
    final UserService users = mock(UserService.class);
    final UserInvitationService invitations = mock(UserInvitationService.class);
    final UUID subject = UUID.randomUUID(), organization = UUID.randomUUID(), project = UUID.randomUUID();
    final String login = "original-login@example.invalid";

    @AfterEach void cleanup() { SecurityContextHolder.clearContext(); }

    Jwt token(boolean includeUsername) {
        Jwt.Builder token = Jwt.withTokenValue("test").header("alg", "RS256").subject(subject.toString())
                .claim("email", "different-email-claim@example.invalid").claim("given_name", "Ada")
                .claim("family_name", "Lovelace").claim("email_verified", false);
        if (includeUsername) token.claim("preferred_username", login);
        return token.build();
    }

    UserProfile profile(User user) {
        Type type = new Type(); type.setName("GENDOX_USER");
        OrganizationUserDTO membership = new OrganizationUserDTO(); membership.setId(organization.toString());
        membership.setAuthorities(Set.of("OP_READ_DOCUMENT"));
        membership.setProjects(List.of(ProjectOrganizationDTO.builder().id(project.toString()).build()));
        return UserProfile.builder().id(user.getId().toString()).email(user.getEmail()).userName(user.getUserName())
                .firstName(user.getFirstName()).lastName(user.getLastName()).name(user.getName())
                .globalUserRoleType(type).organizations(List.of(membership)).build();
    }

    JwtUserProfileConversionFilter conversion() {
        return new JwtUserProfileConversionFilter(users, new JwtDTOUserProfileConverter(), mock(JWTUtils.class, CALLS_REAL_METHODS));
    }

    @Test void registrationAndProfileConversionPreserveOriginalFieldsAndOrganizationAuthorities() throws Exception {
        AtomicReference<User> registered = new AtomicReference<>();
        when(users.getOptionalById(subject)).thenReturn(Optional.empty());
        when(users.createUser(any())).thenAnswer(call -> { registered.set(call.getArgument(0)); return registered.get(); });
        when(users.getUserProfileByUniqueIdentifier(login)).thenAnswer(call -> profile(registered.get()));
        Jwt jwt = token(true); SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
        AtomicBoolean reachedApplication = new AtomicBoolean();
        JwtUserProfileConversionFilter conversion = conversion();
        new JwtUserRegistrationFilter(users, mock(OrganizationService.class), mock(ProjectService.class), invitations)
                .doFilter(new MockHttpServletRequest(), new MockHttpServletResponse(), (request, response) ->
                        conversion.doFilter(request, response, (ignoredRequest, ignoredResponse) -> reachedApplication.set(true)));
        assertTrue(reachedApplication.get());
        User created = registered.get();
        assertEquals(subject, created.getId());
        assertEquals(login, created.getEmail()); assertEquals(login, created.getUserName());
        assertEquals("Ada", created.getFirstName()); assertEquals("Lovelace", created.getLastName());
        assertEquals("Ada Lovelace", created.getName());
        GendoxAuthenticationToken result = (GendoxAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        assertEquals(login, result.getPrincipal().getEmail()); assertEquals(login, result.getPrincipal().getUserName());
        assertEquals("Ada Lovelace", result.getPrincipal().getName());
        assertEquals(project.toString(), result.getPrincipal().getOrganizations().getFirst().getProjects().getFirst().getId());
        assertTrue(result.getAuthorities().stream().anyMatch(authority -> authority.getAuthority().equals("OP_READ_DOCUMENT:" + organization)));
        assertTrue(result.getAuthorities().stream().anyMatch(authority -> authority.getAuthority().equals("GENDOX_USER:GLOBAL_ROLE")));
        assertSame(jwt, result.getJwt());
        verify(users).getUserProfileByUniqueIdentifier(login);
        verify(users, never()).getUserProfileByUserId(any());
        verify(invitations).completeAcceptedInvitations(same(created));
    }

    @Test void existingAccountProfileIsNotOverwrittenFromJwtClaims() throws Exception {
        User existing = new User(); existing.setId(subject); existing.setUserName(login);
        existing.setEmail("stored-email@example.invalid"); existing.setName("Stored display name");
        UserProfile savedProfile = profile(existing);
        when(users.getOptionalById(subject)).thenReturn(Optional.of(existing));
        when(users.getUserProfileByUniqueIdentifier(login)).thenReturn(savedProfile);
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(token(true)));
        JwtUserProfileConversionFilter conversion = conversion();
        new JwtUserRegistrationFilter(users, mock(OrganizationService.class), mock(ProjectService.class), invitations)
                .doFilter(new MockHttpServletRequest(), new MockHttpServletResponse(), (request, response) ->
                        conversion.doFilter(request, response, new MockFilterChain()));
        GendoxAuthenticationToken result = (GendoxAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        assertSame(savedProfile, result.getPrincipal());
        assertEquals("stored-email@example.invalid", result.getPrincipal().getEmail());
        assertEquals("Stored display name", result.getPrincipal().getName());
        verify(users, never()).createUser(any()); verifyNoInteractions(invitations);
    }

    @Test void anIdentifierCollisionCannotLoadAnotherAccountsPermissions() throws Exception {
        UserProfile victim = new UserProfile(); victim.setId(UUID.randomUUID().toString());
        when(users.getUserProfileByUniqueIdentifier(login)).thenReturn(victim);
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(token(true)));
        MockHttpServletResponse response = new MockHttpServletResponse(); AtomicBoolean reachedApplication = new AtomicBoolean();
        conversion().doFilter(new MockHttpServletRequest(), response, (request, servletResponse) -> reachedApplication.set(true));
        assertEquals(401, response.getStatus()); assertFalse(reachedApplication.get());
        assertInstanceOf(JwtAuthenticationToken.class, SecurityContextHolder.getContext().getAuthentication());
    }

    @Test void missingUsernameDoesNotTriggerAnUnscopedUserLookup() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(token(false)));
        MockHttpServletResponse response = new MockHttpServletResponse(); AtomicBoolean reachedApplication = new AtomicBoolean();
        conversion().doFilter(new MockHttpServletRequest(), response, (request, servletResponse) -> reachedApplication.set(true));
        assertEquals(401, response.getStatus()); assertFalse(reachedApplication.get()); verifyNoInteractions(users);
    }
}
