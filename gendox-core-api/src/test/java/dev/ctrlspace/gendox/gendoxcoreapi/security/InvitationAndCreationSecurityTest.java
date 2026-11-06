package dev.ctrlspace.gendox.gendoxcoreapi.security;

import dev.ctrlspace.gendox.authentication.JwtUserRegistrationFilter;
import dev.ctrlspace.gendox.gendoxcoreapi.controller.*;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.*;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.InvitationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.*;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;
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

    final ProjectService projectService = mock(ProjectService.class);
    final SecurityUtils securityUtils = mock(SecurityUtils.class);

    InvitationController controller() {
        return new InvitationController(invitations, limits, projectService, memberships, securityUtils);
    }

    void prepareAcceptance(Invitation invitation) throws Exception {
        when(repository.findByInviteeEmailAndToken(invitation.getInviteeEmail(), "one-use-token")).thenReturn(Optional.of(invitation));
        when(repository.save(any())).thenAnswer(call -> call.getArgument(0));
        when(limits.canInviteUsers(invitation.getOrganizationId())).thenReturn(true);
        when(types.getEmailInvitationStatusByName("ACCEPTED")).thenReturn(type("ACCEPTED"));
    }

    @Test void acceptingAddsAnExistingAccountOnceAndTheLinkCannotBeReplayed() throws Exception {
        Invitation invitation = invitation("PENDING"); User user = invitee(); prepareAcceptance(invitation);
        when(users.getOptionalByEmail(user.getEmail())).thenReturn(Optional.of(user));
        Invitation accepted = controller().acceptInvitation(user.getEmail(), "one-use-token");
        assertEquals("ACCEPTED", accepted.getStatusType().getName());
        verify(memberships).createUserOrganization(user.getId(), invitation.getOrganizationId(), "ROLE_READER");
        verify(projects).createProjectMember(user.getId(), invitation.getProjectId());

        // after the member is removed, the same link must not add them again
        GendoxException replay = assertThrows(GendoxException.class, () -> controller().acceptInvitation(user.getEmail(), "one-use-token"));
        assertEquals("INVITATION_ALREADY_ACCEPTED", replay.getErrorCode());
        verify(memberships, times(1)).createUserOrganization(any(), any(), any());
        verify(projects, times(1)).createProjectMember(any(), any());
    }

    @Test void acceptanceBeforeSignupIsRecordedWithoutMemberships() throws Exception {
        Invitation invitation = invitation("PENDING"); prepareAcceptance(invitation);
        controller().acceptInvitation(invitation.getInviteeEmail(), "one-use-token");
        assertEquals("ACCEPTED", invitation.getStatusType().getName());
        assertEquals("one-use-token", invitation.getToken());
        verifyNoInteractions(memberships, projects);
    }

    @Test void revokedOrExpiredInvitationIsRejected() throws Exception {
        // revoking moves the expiry to the past
        Invitation invitation = invitation("PENDING"); invitation.setExpiresAt(Instant.now().minusSeconds(1));
        prepareAcceptance(invitation);
        GendoxException error = assertThrows(GendoxException.class,
                () -> controller().acceptInvitation(invitation.getInviteeEmail(), "one-use-token"));
        assertEquals("INVITATION_EXPIRED", error.getErrorCode());
        assertEquals("PENDING", invitation.getStatusType().getName());
        verifyNoInteractions(memberships, projects);
        verify(repository, never()).save(any());
    }

    @Test void unknownTokenIsRejected() {
        assertThrows(GendoxException.class, () -> controller().acceptInvitation("invitee@example.invalid", "unknown"));
        verifyNoInteractions(memberships, projects);
    }

    @Test void subscriptionLimitRejectsAcceptanceBeforeChangingItsState() throws Exception {
        Invitation invitation = invitation("PENDING"); prepareAcceptance(invitation);
        when(limits.canInviteUsers(invitation.getOrganizationId())).thenReturn(false);
        assertThrows(GendoxException.class, () -> controller().acceptInvitation(invitation.getInviteeEmail(), "one-use-token"));
        assertEquals("PENDING", invitation.getStatusType().getName());
        verifyNoInteractions(memberships, projects);
    }

    @Test void firstLoginStillCompletesInvitationsAcceptedBeforeSignup() throws Exception {
        Invitation invitation = invitation("ACCEPTED"); prepareAcceptance(invitation);
        org.springframework.test.util.ReflectionTestUtils.setField(invitations, "frontendDomain", "https://app.example.invalid");
        org.springframework.test.util.ReflectionTestUtils.setField(invitations, "acceptUrlTemplate", "/accept?email=%s&token=%s");
        when(repository.findAll(any(com.querydsl.core.types.Predicate.class), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(invitation)));
        UUID subject = UUID.randomUUID();
        when(users.getOptionalUserByUniqueIdentifier(invitation.getInviteeEmail())).thenReturn(Optional.empty());
        when(users.createUser(any())).thenAnswer(call -> call.getArgument(0));
        when(users.getOptionalByEmail(invitation.getInviteeEmail())).thenAnswer(call -> {
            User user = invitee(); user.setId(subject); return Optional.of(user);
        });
        Jwt jwt = Jwt.withTokenValue("test").header("alg", "RS256").subject(subject.toString())
                .claim("preferred_username", invitation.getInviteeEmail()).build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
        new JwtUserRegistrationFilter(users, mock(OrganizationService.class), mock(ProjectService.class), invitations)
                .doFilter(new MockHttpServletRequest(), new MockHttpServletResponse(), new MockFilterChain());
        verify(memberships).createUserOrganization(subject, invitation.getOrganizationId(), "ROLE_READER");
        verify(projects).createProjectMember(subject, invitation.getProjectId());
    }

    Invitation newInvitation(UUID org, String role) {
        Invitation invitation = new Invitation(); invitation.setOrganizationId(org); invitation.setProjectId(UUID.randomUUID());
        invitation.setInviteeEmail("invitee@example.invalid"); invitation.setUserRoleType(type(role));
        return invitation;
    }

    Authentication inviterAuthentication(UUID inviterId) {
        UserProfile inviter = UserProfile.builder().id(inviterId.toString()).email("admin@example.invalid").build();
        return new TestingAuthenticationToken(inviter, null);
    }

    @Test void invitingIntoAProjectOfAnotherOrganizationIsRejected() throws Exception {
        UUID org = UUID.randomUUID(); Invitation invitation = newInvitation(org, "ROLE_READER");
        doThrow(new GendoxException("PROJECT_NOT_IN_ORGANIZATION", "x", HttpStatus.BAD_REQUEST))
                .when(projectService).validateProjectsBelongToOrganization(List.of(invitation.getProjectId()), org);
        assertThrows(GendoxException.class, () -> controller().inviteUser(org.toString(), invitation, inviterAuthentication(UUID.randomUUID())));
        verify(repository, never()).save(any());
    }

    @Test void inviterCannotGiveARoleHigherThanTheirOwn() throws Exception {
        UUID org = UUID.randomUUID(), inviterId = UUID.randomUUID(); Invitation invitation = newInvitation(org, "ROLE_OWNER");
        when(securityUtils.hasAuthority(any(UserProfile.class), eq("OP_ADD_PROJECT_MEMBERS"), any())).thenReturn(true);
        when(memberships.getUserOrganizationRoleType(inviterId, org)).thenReturn(type("ROLE_ADMIN"));
        GendoxException error = assertThrows(GendoxException.class,
                () -> controller().inviteUser(org.toString(), invitation, inviterAuthentication(inviterId)));
        assertEquals("USER_ROLE_CHANGE_NOT_ALLOWED", error.getErrorCode());
        verify(repository, never()).save(any());
    }

    @Test void invitingIntoAProjectTheInviterCannotManageIsRejected() throws Exception {
        UUID org = UUID.randomUUID(); Invitation invitation = newInvitation(org, "ROLE_READER");
        when(securityUtils.hasAuthority(any(UserProfile.class), eq("OP_ADD_PROJECT_MEMBERS"), any())).thenReturn(false);
        assertThrows(GendoxException.class, () -> controller().inviteUser(org.toString(), invitation, inviterAuthentication(UUID.randomUUID())));
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
