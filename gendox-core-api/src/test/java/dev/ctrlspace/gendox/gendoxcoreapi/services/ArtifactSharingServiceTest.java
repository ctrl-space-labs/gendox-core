package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactMember;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactThread;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactVersion;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ChatThread;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactMemberRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactThreadRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectMemberRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ArtifactAccessService.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ArtifactSharingServiceTest {

    @InjectMocks
    private ArtifactSharingService artifactSharingService;

    @Mock
    private ArtifactRepository artifactRepository;

    @Mock
    private ArtifactMemberRepository artifactMemberRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private ArtifactAccessService artifactAccessService;

    @Mock
    private TypeService typeService;

    @Mock
    private ArtifactThreadRepository artifactThreadRepository;

    @Mock
    private MessageService messageService;

    @Mock
    private ProjectService projectService;

    @Mock
    private ArtifactService artifactService;

    @Mock
    private OrganizationService organizationService;

    private final UUID organizationId = UUID.randomUUID();

    private final UUID projectId = UUID.randomUUID();
    private final UUID ownerId = UUID.randomUUID();
    private final UUID editorId = UUID.randomUUID();
    private final UUID memberId = UUID.randomUUID();
    private Artifact artifact;

    private static Type role(String name) {
        return Type.builder().typeCategory("ARTIFACT_ROLE").name(name).build();
    }

    @BeforeEach
    void setUp() throws GendoxException {
        artifact = Artifact.builder().id(UUID.randomUUID()).projectId(projectId).ownerId(ownerId).build();
        when(artifactRepository.findById(artifact.getId())).thenReturn(Optional.of(artifact));
        when(artifactRepository.lockById(artifact.getId())).thenReturn(Optional.of(artifact));
        when(artifactRepository.save(any(Artifact.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(artifactMemberRepository.save(any(ArtifactMember.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(artifactMemberRepository.findByArtifactIdAndUserId(any(), any())).thenReturn(Optional.empty());
        when(projectMemberRepository.existsByProjectIdAndUserId(projectId, memberId)).thenReturn(true);
        for (String name : new String[]{"VIEW", "INTERACT", "EDIT"}) {
            when(typeService.getByCategoryAndName("ARTIFACT_ROLE", name)).thenReturn(role(name));
        }
        // the owner passes every check; an editor sees it but is not the owner
        when(artifactAccessService.require(eq(artifact), eq(ownerId), any())).thenReturn(Role.OWNER);
        when(artifactAccessService.require(artifact, editorId, Role.OWNER)).thenThrow(
                new GendoxException("ARTIFACT_ROLE_TOO_LOW", "needs OWNER", HttpStatus.FORBIDDEN));
    }

    @Test
    void setGeneralAccess_ownerGivesTheAgentARole() throws GendoxException {
        Artifact saved = artifactSharingService.setGeneralAccess(artifact.getId(), ownerId, "edit");

        assertEquals("EDIT", saved.getGeneralAccessRole().getName());
    }

    @Test
    void setGeneralAccess_nullMakesItTheOwnersAndTheInvitedOnly() throws GendoxException {
        artifact.setGeneralAccessRole(role("VIEW"));

        Artifact saved = artifactSharingService.setGeneralAccess(artifact.getId(), ownerId, null);

        assertNull(saved.getGeneralAccessRole());
    }

    @Test
    void setGeneralAccess_byAnEditor_isRefusedAndChangesNothing() {
        GendoxException e = assertThrows(GendoxException.class,
                () -> artifactSharingService.setGeneralAccess(artifact.getId(), editorId, "EDIT"));

        assertEquals(HttpStatus.FORBIDDEN, e.getHttpStatus());
        verify(artifactRepository, never()).save(any());
    }

    @Test
    void setGeneralAccess_ownerIsNotARoleToGive() {
        GendoxException e = assertThrows(GendoxException.class,
                () -> artifactSharingService.setGeneralAccess(artifact.getId(), ownerId, "OWNER"));

        assertEquals("ARTIFACT_ROLE_NOT_SUPPORTED", e.getErrorCode());
    }

    @Test
    void everyWriteOfTheOwnerLocksTheArtifact_soNoneSavesValuesAnotherHasChanged() throws GendoxException {
        artifactSharingService.makePublic(artifact.getId(), ownerId);
        artifactSharingService.makePrivate(artifact.getId(), ownerId);
        artifactSharingService.setGeneralAccess(artifact.getId(), ownerId, "VIEW");
        artifactSharingService.setMemberRole(artifact.getId(), ownerId, memberId, "VIEW");
        artifactSharingService.removeMember(artifact.getId(), ownerId, memberId);
        artifactSharingService.delete(artifact.getId(), ownerId);

        verify(artifactRepository, times(6)).lockById(artifact.getId());
        verify(artifactRepository, never()).findById(artifact.getId());
    }

    @Test
    void anArtifactThatDoesNotExist_isNotFound() {
        UUID missing = UUID.randomUUID();
        when(artifactRepository.lockById(missing)).thenReturn(Optional.empty());

        GendoxException e = assertThrows(GendoxException.class,
                () -> artifactSharingService.makePublic(missing, ownerId));

        assertEquals("ARTIFACT_NOT_FOUND", e.getErrorCode());
    }

    @Test
    void setMemberRole_invitesAMemberOfTheAgent() throws GendoxException {
        ArtifactMember member = artifactSharingService.setMemberRole(artifact.getId(), ownerId, memberId, "INTERACT");

        assertEquals(memberId, member.getUserId());
        assertEquals("INTERACT", member.getRole().getName());
        assertEquals(ownerId, member.getCreatedBy());
        assertNotNull(member.getCreatedAt());
    }

    @Test
    void setMemberRole_againChangesTheSameInvitation() throws GendoxException {
        UUID invitationId = UUID.randomUUID();
        when(artifactMemberRepository.findByArtifactIdAndUserId(artifact.getId(), memberId))
                .thenReturn(Optional.of(ArtifactMember.builder().id(invitationId).artifactId(artifact.getId())
                        .userId(memberId).role(role("VIEW")).createdBy(ownerId).build()));

        ArtifactMember member = artifactSharingService.setMemberRole(artifact.getId(), ownerId, memberId, "EDIT");

        assertEquals(invitationId, member.getId());
        assertEquals("EDIT", member.getRole().getName());
        assertEquals(ownerId, member.getUpdatedBy());
    }

    @Test
    void setMemberRole_someoneOutsideTheAgent_isRefused() {
        UUID outsider = UUID.randomUUID();

        GendoxException e = assertThrows(GendoxException.class,
                () -> artifactSharingService.setMemberRole(artifact.getId(), ownerId, outsider, "VIEW"));

        assertEquals("ARTIFACT_MEMBER_NOT_IN_AGENT", e.getErrorCode());
        verify(artifactMemberRepository, never()).save(any());
    }

    @Test
    void setMemberRole_theOwner_isRefused() {
        GendoxException e = assertThrows(GendoxException.class,
                () -> artifactSharingService.setMemberRole(artifact.getId(), ownerId, ownerId, "VIEW"));

        assertEquals("ARTIFACT_MEMBER_IS_OWNER", e.getErrorCode());
    }

    @Test
    void removeMember_thatWasNeverInvited_isNotAnError() throws GendoxException {
        artifactSharingService.removeMember(artifact.getId(), ownerId, memberId);

        verify(artifactMemberRepository, never()).delete(any());
    }

    @Test
    void makePublic_givesALinkAndKeepsItWhenAskedAgain() throws GendoxException {
        UUID first = artifactSharingService.makePublic(artifact.getId(), ownerId).getPublicId();
        UUID again = artifactSharingService.makePublic(artifact.getId(), ownerId).getPublicId();

        assertNotNull(first);
        assertEquals(first, again);
        assertEquals(ownerId, artifact.getPublicBy());
    }

    @Test
    void makePublic_afterMakingItPrivate_givesANewLink() throws GendoxException {
        UUID first = artifactSharingService.makePublic(artifact.getId(), ownerId).getPublicId();
        artifactSharingService.makePrivate(artifact.getId(), ownerId);
        UUID second = artifactSharingService.makePublic(artifact.getId(), ownerId).getPublicId();

        assertNotEquals(first, second);
    }

    @Test
    void makePrivate_closesTheLink() throws GendoxException {
        artifactSharingService.makePublic(artifact.getId(), ownerId);

        Artifact saved = artifactSharingService.makePrivate(artifact.getId(), ownerId);

        assertNull(saved.getPublicId());
        assertNull(saved.getPublicAt());
        assertNull(saved.getPublicBy());
    }

    @Test
    void delete_byTheOwner_deletesIt() throws GendoxException {
        artifactSharingService.delete(artifact.getId(), ownerId);

        verify(artifactRepository).delete(artifact);
    }

    @Test
    void delete_byAnEditor_isRefused() {
        assertThrows(GendoxException.class, () -> artifactSharingService.delete(artifact.getId(), editorId));

        verify(artifactRepository, never()).delete(any());
    }

    // Change it in a chat

    private ChatThread newThreadFor(UUID agentUserId) throws GendoxException {
        ProjectAgent agent = new ProjectAgent();
        agent.setUserId(agentUserId);
        Project project = new Project();
        project.setProjectAgent(agent);
        when(projectService.getProjectById(projectId)).thenReturn(project);
        ChatThread thread = new ChatThread();
        thread.setId(UUID.randomUUID());
        when(messageService.createThreadForMessage(any(), eq(projectId), any())).thenReturn(thread);
        return thread;
    }

    @Test
    void openInNewChat_startsTheUsersOwnConversationWithTheAgentOpenedOnIt() throws GendoxException {
        UUID agentUserId = UUID.randomUUID();
        artifact.setTitle("Order counter");
        ChatThread thread = newThreadFor(agentUserId);

        ChatThread opened = artifactSharingService.openInNewChat(artifact.getId(), editorId);

        assertSame(thread, opened);
        verify(messageService).createThreadForMessage(List.of(editorId, agentUserId), projectId, "Order counter");
        ArgumentCaptor<ArtifactThread> link = ArgumentCaptor.forClass(ArtifactThread.class);
        verify(artifactThreadRepository).save(link.capture());
        assertEquals(artifact.getId(), link.getValue().getArtifactId());
        assertEquals(thread.getId(), link.getValue().getThreadId());
        assertEquals(editorId, link.getValue().getCreatedBy());
        assertNotNull(link.getValue().getCreatedAt());
    }

    @Test
    void openInNewChat_withAnAgentWithoutAUser_hasTheUserAloneAndIsNotPublic() throws GendoxException {
        newThreadFor(null);

        artifactSharingService.openInNewChat(artifact.getId(), editorId);

        verify(messageService).createThreadForMessage(eq(List.of(editorId)), eq(projectId), any());
    }

    @Test
    void openInNewChat_needsTheEditRole() throws GendoxException {
        UUID viewerId = UUID.randomUUID();
        when(artifactAccessService.require(artifact, viewerId, Role.EDIT)).thenThrow(
                new GendoxException("ARTIFACT_ROLE_TOO_LOW", "needs EDIT", HttpStatus.FORBIDDEN));

        GendoxException e = assertThrows(GendoxException.class,
                () -> artifactSharingService.openInNewChat(artifact.getId(), viewerId));

        assertEquals("ARTIFACT_ROLE_TOO_LOW", e.getErrorCode());
        verifyNoInteractions(messageService);
        verify(artifactThreadRepository, never()).save(any());
    }

    private Project projectWithAgent(String agentName) throws GendoxException {
        Project project = new Project();
        project.setId(projectId);
        project.setOrganizationId(organizationId);
        project.setActive(true);
        project.setName("Sales");
        Organization organization = new Organization();
        organization.setActive(true);
        when(organizationService.getById(organizationId)).thenReturn(organization);
        ProjectAgent agent = new ProjectAgent();
        agent.setAgentName(agentName);
        project.setProjectAgent(agent);
        return project;
    }

    @Test
    void aPublicLinkShowsTheLatestVersionAndTheAgentsName() throws GendoxException {
        UUID publicId = UUID.randomUUID();
        artifact.setPublicId(publicId);
        ArtifactVersion latest = ArtifactVersion.builder().version(3).content("<p>v3</p>").build();
        when(artifactRepository.findByPublicId(publicId)).thenReturn(Optional.of(artifact));
        when(artifactService.getVersion(artifact, null)).thenReturn(latest);
        Project project1 = projectWithAgent("Sales assistant");
        when(projectService.getProjectById(projectId)).thenReturn(project1);

        ArtifactSharingService.PublicArtifact found = artifactSharingService.getPublic(publicId, null);

        assertSame(latest, found.shown());
        assertEquals("Sales assistant", found.agentName());
        verifyNoInteractions(artifactAccessService);
    }

    @Test
    void anAgentWithoutANameIsNamedByItsProject() throws GendoxException {
        UUID publicId = UUID.randomUUID();
        when(artifactRepository.findByPublicId(publicId)).thenReturn(Optional.of(artifact));
        when(artifactService.getVersion(artifact, 1)).thenReturn(ArtifactVersion.builder().version(1).build());
        Project project2 = projectWithAgent(" ");
        when(projectService.getProjectById(projectId)).thenReturn(project2);

        assertEquals("Sales", artifactSharingService.getPublic(publicId, 1).agentName());
    }

    @Test
    void aLinkOfADeletedAgentIsNotFound_asItsOwnerCanNoLongerCloseIt() throws GendoxException {
        UUID publicId = UUID.randomUUID();
        when(artifactRepository.findByPublicId(publicId)).thenReturn(Optional.of(artifact));
        Project deleted = projectWithAgent("Sales assistant");
        deleted.setActive(false);
        when(projectService.getProjectById(projectId)).thenReturn(deleted);

        GendoxException e = assertThrows(GendoxException.class, () -> artifactSharingService.getPublic(publicId, null));

        assertEquals("ARTIFACT_NOT_FOUND", e.getErrorCode());
        verify(artifactService, never()).getVersion(any(), any());
    }

    @Test
    void aLinkOfADeletedOrganizationIsNotFound() throws GendoxException {
        UUID publicId = UUID.randomUUID();
        when(artifactRepository.findByPublicId(publicId)).thenReturn(Optional.of(artifact));
        Project project3 = projectWithAgent("Sales assistant");
        when(projectService.getProjectById(projectId)).thenReturn(project3);
        Organization deleted = new Organization();
        deleted.setActive(false);
        when(organizationService.getById(organizationId)).thenReturn(deleted);

        GendoxException e = assertThrows(GendoxException.class, () -> artifactSharingService.getPublic(publicId, null));

        assertEquals("ARTIFACT_NOT_FOUND", e.getErrorCode());
        verify(artifactService, never()).getVersion(any(), any());
    }

    @Test
    void aLinkThatIsNotPublicIsNotFound() {
        UUID publicId = UUID.randomUUID();
        when(artifactRepository.findByPublicId(publicId)).thenReturn(Optional.empty());

        GendoxException e = assertThrows(GendoxException.class, () -> artifactSharingService.getPublic(publicId, null));

        assertEquals("ARTIFACT_NOT_FOUND", e.getErrorCode());
        assertEquals(HttpStatus.NOT_FOUND, e.getHttpStatus());
    }
}
