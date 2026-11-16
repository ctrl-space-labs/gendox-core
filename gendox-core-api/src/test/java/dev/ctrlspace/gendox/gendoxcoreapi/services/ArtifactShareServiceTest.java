package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactShare;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ArtifactShareCreateRequestDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactShareRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectMemberRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserOrganizationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ArtifactShareServiceTest {

    @InjectMocks
    private ArtifactShareService artifactShareService;

    @Mock
    private ArtifactRepository artifactRepository;
    @Mock
    private ArtifactShareRepository artifactShareRepository;
    @Mock
    private ArtifactService artifactService;
    @Mock
    private TypeService typeService;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProjectMemberRepository projectMemberRepository;
    @Mock
    private UserOrganizationRepository userOrganizationRepository;
    @Mock
    private UserRepository userRepository;

    private final Instant now = Instant.parse("2026-11-16T12:00:00Z");
    private final UUID threadId = UUID.randomUUID();
    private final UUID projectId = UUID.randomUUID();
    private final UUID organizationId = UUID.randomUUID();
    private final UUID owner = UUID.randomUUID();
    private final UUID colleague = UUID.randomUUID();
    private final UUID stranger = UUID.randomUUID();

    private Artifact artifact;

    @BeforeEach
    void setUp() throws GendoxException {
        artifactShareService.clock = Clock.fixed(now, ZoneOffset.UTC);
        artifact = Artifact.builder().id(UUID.randomUUID()).threadId(threadId).projectId(projectId)
                .title("Returns policy").latestVersion(3).build();
        when(artifactRepository.lockByIdAndThreadId(artifact.getId(), threadId)).thenReturn(Optional.of(artifact));

        Project project = new Project();
        project.setId(projectId);
        project.setOrganizationId(organizationId);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        when(typeService.getByCategoryAndName(eq(ArtifactShareService.AUDIENCE_CATEGORY), any()))
                .thenAnswer(call -> Type.builder().typeCategory(call.getArgument(0)).name(call.getArgument(1)).build());
        when(artifactShareRepository.save(any())).thenAnswer(call -> call.getArgument(0));
        when(artifactShareRepository.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));

        // the owner and the colleague are in the organization; the stranger is not
        when(userOrganizationRepository.existsByUserIdAndOrganizationId(owner, organizationId)).thenReturn(true);
        when(userOrganizationRepository.existsByUserIdAndOrganizationId(colleague, organizationId)).thenReturn(true);
    }

    private ArtifactShareCreateRequestDTO request(String audience, UUID user, Integer version, Instant expiresAt) {
        return ArtifactShareCreateRequestDTO.builder()
                .audience(audience).sharedWithUserId(user).version(version).expiresAt(expiresAt).build();
    }

    private ArtifactShare share(UUID sharedWith) {
        return ArtifactShare.builder().id(UUID.randomUUID()).artifact(artifact)
                .audienceType(Type.builder().name(sharedWith == null ? "PROJECT" : "USER").build())
                .sharedWithUserId(sharedWith).createdBy(owner).createdAt(now.minusSeconds(60)).build();
    }

    private void stored(ArtifactShare share) {
        when(artifactShareRepository.findById(share.getId())).thenReturn(Optional.of(share));
    }

    private static void assertCode(String code, org.junit.jupiter.api.function.Executable call) {
        assertEquals(code, assertThrows(GendoxException.class, call).getErrorCode());
    }

    // ---------------------------------------------------------------- sharing

    @Test
    void sharingWithTheProjectFollowsTheLatestByDefault() throws GendoxException {
        ArtifactShare share = artifactShareService.share(threadId, artifact.getId(), owner, request("project", null, null, null));

        assertEquals("PROJECT", share.getAudienceType().getName());
        assertNull(share.getSharedWithUserId());
        assertNull(share.getVersion());
        assertEquals(owner, share.getCreatedBy());
        assertSame(artifact, share.getArtifact());
    }

    @Test
    void sharingWithAUserPinsTheVersionAsked() throws GendoxException {
        ArtifactShare share = artifactShareService.share(threadId, artifact.getId(), owner, request("USER", colleague, 2, null));

        assertEquals("USER", share.getAudienceType().getName());
        assertEquals(colleague, share.getSharedWithUserId());
        assertEquals(2, share.getVersion());
    }

    @Test
    void aUserShareNamesSomeoneElseInTheOrganization() {
        assertCode("ARTIFACT_SHARE_USER_REQUIRED",
                () -> artifactShareService.share(threadId, artifact.getId(), owner, request("USER", null, null, null)));
        assertCode("ARTIFACT_SHARE_WITH_SELF",
                () -> artifactShareService.share(threadId, artifact.getId(), owner, request("USER", owner, null, null)));
        assertCode("ARTIFACT_SHARE_USER_NOT_IN_ORGANIZATION",
                () -> artifactShareService.share(threadId, artifact.getId(), owner, request("USER", stranger, null, null)));
        verify(artifactShareRepository, never()).save(any());
    }

    @Test
    void aProjectShareNamesNoUser() {
        assertCode("ARTIFACT_SHARE_USER_NOT_EXPECTED",
                () -> artifactShareService.share(threadId, artifact.getId(), owner, request("PROJECT", colleague, null, null)));
    }

    @Test
    void anUnknownAudienceAVersionThatDoesNotExistOrAnEndInThePastIsRefused() {
        assertCode("ARTIFACT_SHARE_AUDIENCE_INVALID",
                () -> artifactShareService.share(threadId, artifact.getId(), owner, request("PUBLIC", null, null, null)));
        assertCode("ARTIFACT_SHARE_VERSION_INVALID",
                () -> artifactShareService.share(threadId, artifact.getId(), owner, request("PROJECT", null, 4, null)));
        assertCode("ARTIFACT_SHARE_VERSION_INVALID",
                () -> artifactShareService.share(threadId, artifact.getId(), owner, request("PROJECT", null, 0, null)));
        assertCode("ARTIFACT_SHARE_EXPIRES_IN_PAST",
                () -> artifactShareService.share(threadId, artifact.getId(), owner, request("PROJECT", null, null, now)));
        verify(artifactShareRepository, never()).save(any());
    }

    @Test
    void anArtifactOfAnotherThreadIsNotFound() {
        assertCode("ARTIFACT_NOT_FOUND",
                () -> artifactShareService.share(UUID.randomUUID(), artifact.getId(), owner, request("PROJECT", null, null, null)));
    }

    @Test
    void sharingAgainRevokesTheActiveShareAndWritesThatFirst() throws GendoxException {
        ArtifactShare previous = share(colleague);
        when(artifactShareRepository.findByArtifact_IdAndSharedWithUserIdAndRevokedAtIsNull(artifact.getId(), colleague))
                .thenReturn(Optional.of(previous));

        artifactShareService.share(threadId, artifact.getId(), owner, request("USER", colleague, null, null));

        // the revocation is flushed before the insert, or the database's one-active-share index refuses the insert
        InOrder order = inOrder(artifactShareRepository);
        ArgumentCaptor<ArtifactShare> revoked = ArgumentCaptor.forClass(ArtifactShare.class);
        order.verify(artifactShareRepository).saveAndFlush(revoked.capture());
        order.verify(artifactShareRepository).save(any());
        assertEquals(previous.getId(), revoked.getValue().getId());
        assertEquals(now, revoked.getValue().getRevokedAt());
        assertEquals(owner, revoked.getValue().getRevokedBy());
    }

    @Test
    void aShareWithTheProjectLeavesTheSharesWithUsersAlone() throws GendoxException {
        artifactShareService.share(threadId, artifact.getId(), owner, request("PROJECT", null, null, null));

        verify(artifactShareRepository).findByArtifact_IdAndSharedWithUserIdIsNullAndRevokedAtIsNull(artifact.getId());
        verify(artifactShareRepository, never()).findByArtifact_IdAndSharedWithUserIdAndRevokedAtIsNull(any(), any());
        verify(artifactShareRepository, never()).saveAndFlush(any());
    }

    @Test
    void stoppingAShareTwiceChangesNothingTheSecondTime() throws GendoxException {
        ArtifactShare share = share(null).toBuilder().revokedAt(now.minusSeconds(5)).revokedBy(owner).build();
        stored(share);

        artifactShareService.revoke(threadId, artifact.getId(), share.getId(), owner);

        verify(artifactShareRepository, never()).save(any());
    }

    @Test
    void aShareOfAnotherArtifactCannotBeStoppedThroughThisOne() throws GendoxException {
        ArtifactShare share = share(null);
        stored(share);

        assertCode("ARTIFACT_SHARE_NOT_FOUND",
                () -> artifactShareService.revoke(threadId, UUID.randomUUID(), share.getId(), owner));
    }

    @Test
    void theOwnerSeesOnlyTheSharesActiveNow() {
        ArtifactShare open = share(null);
        ArtifactShare ended = share(colleague).toBuilder().expiresAt(now.minusSeconds(1)).build();
        when(artifactShareRepository.findAllByArtifact_IdAndRevokedAtIsNullOrderByCreatedAtAsc(artifact.getId()))
                .thenReturn(List.of(open, ended));

        assertEquals(List.of(open), artifactShareService.getActiveShares(artifact.getId()));
    }

    // ---------------------------------------------------------------- opening

    @Test
    void theUserItWasSharedWithOpensIt() throws GendoxException {
        ArtifactShare share = share(colleague);
        stored(share);

        assertSame(share, artifactShareService.open(share.getId(), colleague));
    }

    @Test
    void aUserWhoLeftTheOrganizationCannotOpenWhatWasSharedWithThem() {
        ArtifactShare share = share(colleague);
        stored(share);
        when(userOrganizationRepository.existsByUserIdAndOrganizationId(colleague, organizationId)).thenReturn(false);

        assertCode("ARTIFACT_SHARE_NOT_FOUND", () -> artifactShareService.open(share.getId(), colleague));
    }

    @Test
    void aShareWithOneUserIsNotFoundForAnyoneElse() {
        ArtifactShare share = share(colleague);
        stored(share);
        when(projectMemberRepository.existsByProjectIdAndUserId(projectId, stranger)).thenReturn(true);

        assertCode("ARTIFACT_SHARE_NOT_FOUND", () -> artifactShareService.open(share.getId(), stranger));
    }

    @Test
    void aProjectShareOpensForTheProjectsMembersOnly() throws GendoxException {
        ArtifactShare share = share(null);
        stored(share);
        when(projectMemberRepository.existsByProjectIdAndUserId(projectId, colleague)).thenReturn(true);

        assertSame(share, artifactShareService.open(share.getId(), colleague));
        assertCode("ARTIFACT_SHARE_NOT_FOUND", () -> artifactShareService.open(share.getId(), stranger));
    }

    @Test
    void itsOwnerOpensItToSeeWhatOthersSee() throws GendoxException {
        ArtifactShare share = share(colleague);
        stored(share);

        assertSame(share, artifactShareService.open(share.getId(), owner));
    }

    @Test
    void aStoppedOrEndedShareIsNotFoundEvenForItsReader() {
        ArtifactShare stopped = share(colleague).toBuilder().revokedAt(now.minusSeconds(5)).build();
        ArtifactShare ended = share(colleague).toBuilder().id(UUID.randomUUID()).expiresAt(now).build();
        stored(stopped);
        stored(ended);

        assertCode("ARTIFACT_SHARE_NOT_FOUND", () -> artifactShareService.open(stopped.getId(), colleague));
        assertCode("ARTIFACT_SHARE_NOT_FOUND", () -> artifactShareService.open(ended.getId(), colleague));
    }

    @Test
    void withoutASignedInUserNothingOpens() {
        ArtifactShare share = share(null);
        stored(share);

        assertCode("ARTIFACT_SHARE_NOT_FOUND", () -> artifactShareService.open(share.getId(), null));
    }

    @Test
    void aShareIsActiveUntilItsEndOrUntilItIsStopped() {
        ArtifactShare share = share(null).toBuilder().expiresAt(now.plus(Duration.ofDays(1))).build();

        assertTrue(share.isActive(now));
        assertFalse(share.isActive(now.plus(Duration.ofDays(1))));
        assertFalse(share.toBuilder().revokedAt(now).build().isActive(now));
    }
}
