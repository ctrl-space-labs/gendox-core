package dev.ctrlspace.gendox.gendoxcoreapi.security;

import dev.ctrlspace.gendox.authentication.JwtUserRegistrationFilter;
import dev.ctrlspace.gendox.gendoxcoreapi.controller.*;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.*;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.InvitationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.thymeleaf.TemplateEngine;

import java.time.Instant;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class InvitationAndCreationSecurityTest {
    final InvitationRepository repository = mock(InvitationRepository.class);
    final UserOrganizationService memberships = mock(UserOrganizationService.class);
    final ProjectMemberService projects = mock(ProjectMemberService.class);
    final UserService users = mock(UserService.class);
    final TypeService types = mock(TypeService.class);
    final SubscriptionValidationService limits = mock(SubscriptionValidationService.class);
    final UserInvitationService invitations = new UserInvitationService(repository, types, memberships,
            mock(OrganizationService.class), users, projects, mock(EmailService.class), mock(TemplateEngine.class), limits);

    @AfterEach void cleanup() { SecurityContextHolder.clearContext(); }

    Type type(String name) { Type type = new Type(); type.setName(name); return type; }

    Invitation invitation(String status) {
        Invitation invitation = new Invitation(); invitation.setId(UUID.randomUUID());
        invitation.setOrganizationId(UUID.randomUUID()); invitation.setProjectId(UUID.randomUUID());
        invitation.setInviterUserId(UUID.randomUUID()); invitation.setInviteeEmail("invitee@example.invalid");
        invitation.setToken("one-use-token"); invitation.setExpiresAt(Instant.now().plusSeconds(600));
        invitation.setStatusType(type(status)); invitation.setUserRoleType(type("ROLE_READER"));
        return invitation;
    }

    User invitee() {
        User user = new User(); user.setId(UUID.randomUUID()); user.setEmail("invitee@example.invalid"); return user;
    }

    InvitationController controller() {
        return new InvitationController(invitations, limits, mock(ProjectService.class), memberships, mock(SecurityUtils.class));
    }

    void prepareAcceptance(Invitation invitation) throws Exception {
        when(repository.findByInviteeEmailAndToken(invitation.getInviteeEmail(), "one-use-token")).thenReturn(Optional.of(invitation));
        when(repository.save(any())).thenAnswer(call -> call.getArgument(0));
        when(limits.canInviteUsers(invitation.getOrganizationId())).thenReturn(true);
        when(types.getEmailInvitationStatusByName("ACCEPTED")).thenReturn(type("ACCEPTED"));
    }

    void login(UUID subject, String email, Boolean verified, String username, UserInvitationService service) throws Exception {
        Jwt.Builder jwt = Jwt.withTokenValue("test").header("alg", "RS256").subject(subject.toString())
                .claim("email", email).claim("preferred_username", username);
        if (verified != null) jwt.claim("email_verified", verified);
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt.build()));
        new JwtUserRegistrationFilter(users, mock(OrganizationService.class), mock(ProjectService.class), service)
                .doFilter(new MockHttpServletRequest(), new MockHttpServletResponse(), new MockFilterChain());
    }

    @Test void anonymousAcceptanceImmediatelyAddsAnExistingAccount() throws Exception {
        Invitation invitation = invitation("PENDING"); User user = invitee(); prepareAcceptance(invitation);
        when(users.getOptionalByEmail(user.getEmail())).thenReturn(Optional.of(user));
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        Invitation accepted = controller().acceptInvitation(user.getEmail(), "one-use-token");
        assertEquals("ACCEPTED", accepted.getStatusType().getName());
        assertTrue(accepted.getToken().isBlank());
        verify(memberships).createUserOrganization(user.getId(), invitation.getOrganizationId(), "ROLE_READER");
        verify(projects).createProjectMember(user.getId(), invitation.getProjectId());
        verify(users).evictUserProfileByUniqueIdentifier(any());
        assertThrows(GendoxException.class, () -> controller().acceptInvitation(user.getEmail(), "one-use-token"));
        verify(memberships, times(1)).createUserOrganization(any(), any(), any());
        verify(projects, times(1)).createProjectMember(any(), any());
    }

    @Test void aDifferentSignedInCallerMayAcceptTheLinkForTheInvitedAccount() throws Exception {
        Invitation invitation = invitation("PENDING"); User user = invitee(); prepareAcceptance(invitation);
        when(users.getOptionalByEmail(user.getEmail())).thenReturn(Optional.of(user));
        UUID caller = UUID.randomUUID();
        Jwt jwt = Jwt.withTokenValue("test").header("alg", "RS256").subject(caller.toString()).build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
        controller().acceptInvitation(user.getEmail(), "one-use-token");
        verify(projects).createProjectMember(user.getId(), invitation.getProjectId());
        verify(projects, never()).createProjectMember(eq(caller), any());
    }

    @Test void acceptanceBeforeSignupRecordsConsentWithoutCreatingAnAccount() throws Exception {
        Invitation invitation = invitation("PENDING"); prepareAcceptance(invitation);
        controller().acceptInvitation(invitation.getInviteeEmail(), "one-use-token");
        assertEquals("ACCEPTED", invitation.getStatusType().getName());
        assertEquals("one-use-token", invitation.getToken());
        verifyNoInteractions(memberships, projects);
        verify(users, never()).createUser(any());
        assertThrows(GendoxException.class, () -> controller().acceptInvitation(invitation.getInviteeEmail(), "one-use-token"));
    }

    @Test void firstLoginCompletesAnAcceptedInvitationWithoutVerifiedEmail() throws Exception {
        Invitation invitation = invitation("ACCEPTED"); UUID subject = UUID.randomUUID();
        when(users.getOptionalById(subject)).thenReturn(Optional.empty());
        when(users.createUser(any())).thenAnswer(call -> call.getArgument(0));
        when(repository.lockAcceptedInvitations(invitation.getInviteeEmail())).thenReturn(List.of(invitation));
        when(limits.canInviteUsers(invitation.getOrganizationId())).thenReturn(true);
        login(subject, "different-email-claim@example.invalid", false, invitation.getInviteeEmail(), invitations);
        verify(users).getOptionalById(subject);
        verify(users, never()).getOptionalUserByUniqueIdentifier(any());
        verify(memberships).createUserOrganization(subject, invitation.getOrganizationId(), "ROLE_READER");
        verify(projects).createProjectMember(subject, invitation.getProjectId());
        assertTrue(invitation.getToken().isBlank());
        User existing = invitee(); existing.setId(subject);
        when(users.getOptionalById(subject)).thenReturn(Optional.of(existing));
        login(subject, existing.getEmail(), false, "username-is-not-the-email", invitations);
        verify(repository, times(1)).lockAcceptedInvitations(existing.getEmail());
        verify(projects, times(1)).createProjectMember(any(), any());
    }

    @Test void firstLoginDoesNotRequireAnEmailVerifiedClaim() throws Exception {
        UserInvitationService service = mock(UserInvitationService.class); UUID subject = UUID.randomUUID();
        when(users.createUser(any())).thenAnswer(call -> call.getArgument(0));
        login(subject, "invitee@example.invalid", null, "invitee@example.invalid", service);
        verify(service).completeAcceptedInvitations(argThat(user -> subject.equals(user.getId())
                && "invitee@example.invalid".equals(user.getEmail())));
    }

    @Test void existingLoginsDoNotReprocessAcceptedInvitations() throws Exception {
        User user = invitee(); when(users.getOptionalById(user.getId())).thenReturn(Optional.of(user));
        UserInvitationService service = mock(UserInvitationService.class);
        login(user.getId(), user.getEmail(), true, UUID.randomUUID().toString(), service);
        verifyNoInteractions(service);
        verify(users, never()).createUser(any());
    }

    @Test void signupConsumptionCannotRestoreMembershipByReplay() throws Exception {
        User user = invitee(); Invitation invitation = invitation("ACCEPTED");
        when(repository.lockAcceptedInvitations(user.getEmail())).thenReturn(List.of(invitation));
        when(limits.canInviteUsers(invitation.getOrganizationId())).thenReturn(true);
        invitations.completeAcceptedInvitations(user);
        invitations.completeAcceptedInvitations(user);
        assertTrue(invitation.getToken().isBlank());
        verify(memberships, times(1)).createUserOrganization(user.getId(), invitation.getOrganizationId(), "ROLE_READER");
        verify(projects, times(1)).createProjectMember(user.getId(), invitation.getProjectId());
    }

    @Test void expiredAcceptedInvitationsAreNotAppliedDuringSignup() throws Exception {
        User user = invitee(); Invitation invitation = invitation("ACCEPTED"); invitation.setExpiresAt(Instant.EPOCH);
        when(repository.lockAcceptedInvitations(user.getEmail())).thenReturn(List.of(invitation));
        invitations.completeAcceptedInvitations(user);
        verifyNoInteractions(memberships, projects);
        verify(repository, never()).save(any());
    }

    @Test void existingOrganizationMembershipIsKeptWhenAddingTheProject() throws Exception {
        User user = invitee(); Invitation invitation = invitation("PENDING"); prepareAcceptance(invitation);
        when(users.getOptionalByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(memberships.isUserOrganizationMember(user.getId(), invitation.getOrganizationId())).thenReturn(true);
        controller().acceptInvitation(user.getEmail(), "one-use-token");
        verify(memberships, never()).createUserOrganization(any(), any(), any());
        verify(projects).createProjectMember(user.getId(), invitation.getProjectId());
        assertTrue(invitation.getToken().isBlank());
    }

    @Test void blankAndUnknownTokensCannotCreateMemberships() throws Exception {
        assertThrows(GendoxException.class, () -> controller().acceptInvitation("invitee@example.invalid", ""));
        verifyNoInteractions(repository);
        assertThrows(GendoxException.class, () -> controller().acceptInvitation("invitee@example.invalid", "unknown"));
        verifyNoInteractions(memberships, projects);
        verify(repository, never()).save(any());
    }

    @Test void subscriptionLimitRejectsAcceptanceBeforeChangingItsState() throws Exception {
        Invitation invitation = invitation("PENDING"); prepareAcceptance(invitation);
        when(limits.canInviteUsers(invitation.getOrganizationId())).thenReturn(false);
        assertThrows(GendoxException.class, () -> controller().acceptInvitation(invitation.getInviteeEmail(), "one-use-token"));
        assertEquals("PENDING", invitation.getStatusType().getName());
        verifyNoInteractions(memberships, projects);
        verify(repository, never()).save(any());
    }

    @Test void createControllersRejectExistingIdsBeforeCallingServices() throws Exception {
        UUID existing = UUID.randomUUID(), org = UUID.randomUUID(), project = UUID.randomUUID(), taskId = UUID.randomUUID();
        TaskService taskService = mock(TaskService.class);
        TaskNodeService nodes = mock(TaskNodeService.class);
        TaskEdgeService edges = mock(TaskEdgeService.class);
        TaskController taskController = new TaskController(taskService, mock(TaskNodeConverter.class), mock(TaskEdgeConverter.class),
                mock(TaskCsvExportService.class), nodes, edges, mock(InsightQuestionService.class), mock(SecurityUtils.class));
        TaskNodeDTO node = TaskNodeDTO.builder().id(existing).build();
        TaskEdgeDTO edge = new TaskEdgeDTO(); edge.setId(existing);
        assertThrows(GendoxException.class, () -> taskController.createTaskNode(org, project, node));
        assertThrows(GendoxException.class, () -> taskController.createTaskNodesBatch(org, project, List.of(new TaskNodeDTO(), node)));
        assertThrows(GendoxException.class, () -> taskController.createTaskEdge(org, project, edge));
        verifyNoInteractions(taskService, nodes, edges);

        EOScriptService scripts = mock(EOScriptService.class);
        EOTaskGeometryService geometries = mock(EOTaskGeometryService.class);
        Task task = new Task(); task.setProjectId(project); when(taskService.getTaskById(taskId)).thenReturn(task);
        EarthObservationController eo = new EarthObservationController(scripts, mock(EOScriptConverter.class), geometries,
                mock(EOTaskGeometryConverter.class), taskService);
        EOScriptDTO script = new EOScriptDTO(); script.setId(existing);
        EOTaskGeometryDTO geometry = new EOTaskGeometryDTO(); geometry.setId(existing);
        assertThrows(GendoxException.class, () -> eo.createEOScript(org, project, taskId, script));
        assertThrows(GendoxException.class, () -> eo.createGeometry(org, project, taskId, geometry));
        verifyNoInteractions(scripts, geometries);

        OrganizationModelKeyService keys = mock(OrganizationModelKeyService.class);
        OrganizationModelProviderKey key = new OrganizationModelProviderKey(); key.setId(existing);
        assertThrows(GendoxException.class, () -> new OrganizationModelKeysController(keys).createModelKey(org, key));
        verifyNoInteractions(keys);
    }
}
