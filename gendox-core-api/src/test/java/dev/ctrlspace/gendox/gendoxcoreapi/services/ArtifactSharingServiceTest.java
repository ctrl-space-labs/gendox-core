package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactMember;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactMemberRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactRepository;
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
    void anArtifactThatDoesNotExist_isNotFound() {
        UUID missing = UUID.randomUUID();
        when(artifactRepository.findById(missing)).thenReturn(Optional.empty());

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
}