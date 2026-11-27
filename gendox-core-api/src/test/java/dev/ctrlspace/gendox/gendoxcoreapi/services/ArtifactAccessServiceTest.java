package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactMember;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactMemberRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectMemberRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ArtifactAccessService.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ArtifactAccessServiceTest {

    @InjectMocks
    private ArtifactAccessService artifactAccessService;

    @Mock
    private ArtifactMemberRepository artifactMemberRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    private final UUID projectId = UUID.randomUUID();
    private final UUID ownerId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();
    private Artifact artifact;

    private static Type role(String name) {
        return Type.builder().typeCategory("ARTIFACT_ROLE").name(name).build();
    }

    @BeforeEach
    void setUp() {
        artifact = Artifact.builder().id(UUID.randomUUID()).projectId(projectId).ownerId(ownerId).build();
        // both are members of the agent unless a test says otherwise
        when(projectMemberRepository.existsActiveMembership(projectId, ownerId)).thenReturn(true);
        when(projectMemberRepository.existsActiveMembership(projectId, userId)).thenReturn(true);
        when(artifactMemberRepository.findByArtifactIdAndUserId(any(), any())).thenReturn(Optional.empty());
    }

    private void invite(String roleName) {
        when(artifactMemberRepository.findByArtifactIdAndUserId(artifact.getId(), userId))
                .thenReturn(Optional.of(ArtifactMember.builder().artifactId(artifact.getId()).userId(userId)
                        .role(role(roleName)).build()));
    }

    @Test
    void ownerMayDoEverything() {
        assertEquals(Optional.of(Role.OWNER), artifactAccessService.roleOf(artifact, ownerId));
    }

    @Test
    void ownerWhoLeftTheAgentHasNoRole() {
        when(projectMemberRepository.existsActiveMembership(projectId, ownerId)).thenReturn(false);

        assertEquals(Optional.empty(), artifactAccessService.roleOf(artifact, ownerId));
    }

    @Test
    void anOwnerWhoseAgentOrOrganizationWasDeletedHasNoRole_evenWithAMembershipLeftBehind() {
        // the membership row is still there, but its agent or organization is no longer active
        when(projectMemberRepository.existsActiveMembership(projectId, ownerId)).thenReturn(false);
        lenient().when(projectMemberRepository.existsByProjectIdAndUserId(projectId, ownerId)).thenReturn(true);

        assertEquals(Optional.empty(), artifactAccessService.roleOf(artifact, ownerId));
    }

    @Test
    void noUserHasNoRole() {
        assertEquals(Optional.empty(), artifactAccessService.roleOf(artifact, null));
    }

    @Test
    void memberOfTheAgentSeesNothingWhileOnlyTheOwnerHasIt() {
        assertEquals(Optional.empty(), artifactAccessService.roleOf(artifact, userId));
    }

    @Test
    void memberOfTheAgentGetsTheGeneralAccess() {
        artifact.setGeneralAccessRole(role("VIEW"));

        assertEquals(Optional.of(Role.VIEW), artifactAccessService.roleOf(artifact, userId));
    }

    @Test
    void invitedMemberGetsTheirOwnRole() {
        invite("INTERACT");

        assertEquals(Optional.of(Role.INTERACT), artifactAccessService.roleOf(artifact, userId));
    }

    @Test
    void anInvitationAboveTheGeneralAccessWins() {
        artifact.setGeneralAccessRole(role("VIEW"));
        invite("EDIT");

        assertEquals(Optional.of(Role.EDIT), artifactAccessService.roleOf(artifact, userId));
    }

    @Test
    void anInvitationBelowTheGeneralAccessDoesNotLowerIt() {
        artifact.setGeneralAccessRole(role("EDIT"));
        invite("VIEW");

        assertEquals(Optional.of(Role.EDIT), artifactAccessService.roleOf(artifact, userId));
    }

    @Test
    void someoneOutsideTheAgentHasNoRoleWhateverTheyWereGiven() {
        when(projectMemberRepository.existsActiveMembership(projectId, userId)).thenReturn(false);
        artifact.setGeneralAccessRole(role("EDIT"));
        invite("EDIT");

        assertEquals(Optional.empty(), artifactAccessService.roleOf(artifact, userId));
    }

    @Test
    void requireAnswersNotFoundToSomeoneWhoCannotSeeIt() {
        GendoxException e = assertThrows(GendoxException.class,
                () -> artifactAccessService.require(artifact, userId, Role.VIEW));

        assertEquals("ARTIFACT_NOT_FOUND", e.getErrorCode());
        assertEquals(HttpStatus.NOT_FOUND, e.getHttpStatus());
    }

    @Test
    void requireNamesTheRoleItNeeds() {
        artifact.setGeneralAccessRole(role("VIEW"));

        GendoxException e = assertThrows(GendoxException.class,
                () -> artifactAccessService.require(artifact, userId, Role.EDIT));

        assertEquals("ARTIFACT_ROLE_TOO_LOW", e.getErrorCode());
        assertEquals(HttpStatus.FORBIDDEN, e.getHttpStatus());
        assertTrue(e.getErrorMessage().contains("EDIT"));
    }

    @Test
    void requireReturnsTheRoleWhenItIsEnough() throws GendoxException {
        artifact.setGeneralAccessRole(role("EDIT"));

        assertEquals(Role.EDIT, artifactAccessService.require(artifact, userId, Role.INTERACT));
    }
}