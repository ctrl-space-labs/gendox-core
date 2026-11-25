package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactData;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactDataRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ArtifactAccessService.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ArtifactDataServiceTest {

    private final ObjectMapper objectMapper = JsonMapper.builder().build();

    @InjectMocks
    private ArtifactDataService artifactDataService;

    @Mock
    private ArtifactRepository artifactRepository;

    @Mock
    private ArtifactDataRepository artifactDataRepository;

    @Mock
    private ArtifactAccessService artifactAccessService;

    private final UUID user = UUID.randomUUID();
    private Artifact artifact;

    private JsonNode json(String text) {
        return objectMapper.readTree(text);
    }

    private void hasRole(Role role) throws GendoxException {
        lenient().when(artifactAccessService.require(eqArtifact(), eqUser(), any())).thenAnswer(invocation -> {
            Role needed = invocation.getArgument(2);
            if (!role.atLeast(needed)) {
                throw new GendoxException("ARTIFACT_ROLE_TOO_LOW", "Needs " + needed, HttpStatus.FORBIDDEN);
            }
            return role;
        });
    }

    private Artifact eqArtifact() {
        return org.mockito.ArgumentMatchers.eq(artifact);
    }

    private UUID eqUser() {
        return org.mockito.ArgumentMatchers.eq(user);
    }

    @BeforeEach
    void setUp() {
        artifact = Artifact.builder().id(UUID.randomUUID()).projectId(UUID.randomUUID()).build();
        lenient().when(artifactRepository.findById(artifact.getId())).thenReturn(Optional.of(artifact));
        lenient().when(artifactDataRepository.saveAndFlush(any(ArtifactData.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void aContributorWritesASharedDocument_withTheServerSettingWhoWroteIt() throws GendoxException {
        hasRole(Role.INTERACT);

        ArtifactData saved = artifactDataService.set(artifact.getId(), user, "votes", "item-1",
                json("{\"choice\":\"B\"}"), false, null);

        assertEquals("B", saved.getData().get("choice").asText());
        assertNull(saved.getPrivateTo());
        assertEquals(1, saved.getRevision());
        assertEquals(user, saved.getCreatedBy());
        assertEquals(user, saved.getUpdatedBy());
    }

    @Test
    void aViewerMayNotWriteASharedDocument() throws GendoxException {
        hasRole(Role.VIEW);

        GendoxException e = assertThrows(GendoxException.class, () -> artifactDataService.set(artifact.getId(), user,
                "votes", "item-1", json("{\"choice\":\"B\"}"), false, null));

        assertEquals("ARTIFACT_ROLE_TOO_LOW", e.getErrorCode());
        verify(artifactDataRepository, never()).saveAndFlush(any());
    }

    @Test
    void aViewerKeepsAPrivateDocumentOfTheirOwn() throws GendoxException {
        hasRole(Role.VIEW);

        ArtifactData saved = artifactDataService.set(artifact.getId(), user, "progress", "state",
                json("{\"checked\":[3,4]}"), true, null);

        assertEquals(user, saved.getPrivateTo());
    }

    @Test
    void someoneWithNoRoleIsToldTheArtifactIsNotThere() throws GendoxException {
        when(artifactAccessService.require(artifact, user, Role.VIEW))
                .thenThrow(new GendoxException("ARTIFACT_NOT_FOUND", "No artifact", HttpStatus.NOT_FOUND));

        GendoxException e = assertThrows(GendoxException.class,
                () -> artifactDataService.list(artifact.getId(), user, "votes"));

        assertEquals("ARTIFACT_NOT_FOUND", e.getErrorCode());
        verifyNoInteractions(artifactDataRepository);
    }

    @Test
    void aListIsTheSharedDocumentsAndTheReadersOwnPrivateOnes() throws GendoxException {
        hasRole(Role.VIEW);
        List<ArtifactData> visible = List.of(ArtifactData.builder().docId("a").build());
        when(artifactDataRepository.findVisible(artifact.getId(), "votes", user)).thenReturn(visible);

        assertSame(visible, artifactDataService.list(artifact.getId(), user, "votes"));
    }

    @Test
    void writingAgainRaisesTheRevision_andAnOlderRevisionIsAConflict() throws GendoxException {
        hasRole(Role.INTERACT);
        ArtifactData current = ArtifactData.builder().artifactId(artifact.getId()).collection("votes").docId("item-1")
                .data(json("{\"choice\":\"A\"}")).revision(3).createdBy(user).build();
        when(artifactDataRepository.findByArtifactIdAndCollectionAndDocIdAndPrivateToIsNull(artifact.getId(), "votes",
                "item-1")).thenReturn(Optional.of(current));

        ArtifactData saved = artifactDataService.set(artifact.getId(), user, "votes", "item-1",
                json("{\"choice\":\"B\"}"), false, 3);
        assertEquals(4, saved.getRevision());

        GendoxException e = assertThrows(GendoxException.class, () -> artifactDataService.set(artifact.getId(), user,
                "votes", "item-1", json("{\"choice\":\"C\"}"), false, 3));
        assertEquals("ARTIFACT_DATA_CONFLICT", e.getErrorCode());
    }

    @Test
    void revisionZeroWritesOnlyADocumentThatIsNotThereYet() throws GendoxException {
        hasRole(Role.INTERACT);

        ArtifactData saved = artifactDataService.set(artifact.getId(), user, "votes", "item-1", json("{}"), false, 0);

        assertEquals(1, saved.getRevision());
    }

    @Test
    void twoMakingTheSameDocumentAtOnceIsAConflict() throws GendoxException {
        hasRole(Role.INTERACT);
        when(artifactDataRepository.saveAndFlush(any(ArtifactData.class)))
                .thenThrow(new DataIntegrityViolationException("unique"));

        GendoxException e = assertThrows(GendoxException.class, () -> artifactDataService.set(artifact.getId(), user,
                "votes", "item-1", json("{}"), false, null));

        assertEquals("ARTIFACT_DATA_CONFLICT", e.getErrorCode());
    }

    @Test
    void anUpdateKeepsTheFieldsItDoesNotName() throws GendoxException {
        hasRole(Role.INTERACT);
        ArtifactData current = ArtifactData.builder().artifactId(artifact.getId()).collection("answers").docId("q1")
                .data(json("{\"text\":\"yes\",\"by\":\"u1\"}")).revision(1).createdBy(user).build();
        when(artifactDataRepository.findByArtifactIdAndCollectionAndDocIdAndPrivateToIsNull(artifact.getId(),
                "answers", "q1")).thenReturn(Optional.of(current));

        ArtifactData saved = artifactDataService.update(artifact.getId(), user, "answers", "q1",
                json("{\"text\":\"no\"}"), false, null);

        assertEquals("no", saved.getData().get("text").asText());
        assertEquals("u1", saved.getData().get("by").asText());
    }

    @Test
    void anUpdateThatIsNotAnObjectIsRefused() throws GendoxException {
        hasRole(Role.INTERACT);

        GendoxException e = assertThrows(GendoxException.class, () -> artifactDataService.update(artifact.getId(),
                user, "answers", "q1", json("[1,2]"), false, null));

        assertEquals("ARTIFACT_DATA_NOT_AN_OBJECT", e.getErrorCode());
    }

    @Test
    void aDocumentOverTheLimitIsRefused() throws GendoxException {
        hasRole(Role.INTERACT);
        ReflectionTestUtils.setField(artifactDataService, "maxDocumentLength", 10);

        GendoxException e = assertThrows(GendoxException.class, () -> artifactDataService.set(artifact.getId(), user,
                "notes", "n1", json("{\"text\":\"far too long\"}"), false, null));

        assertEquals("ARTIFACT_DATA_TOO_LONG", e.getErrorCode());
    }

    @Test
    void aFullArtifactTakesNoNewDocument() throws GendoxException {
        hasRole(Role.INTERACT);
        ReflectionTestUtils.setField(artifactDataService, "maxDocuments", 2);
        when(artifactDataRepository.countByArtifactId(artifact.getId())).thenReturn(2L);

        GendoxException e = assertThrows(GendoxException.class, () -> artifactDataService.set(artifact.getId(), user,
                "notes", "n3", json("{}"), false, null));

        assertEquals("ARTIFACT_DATA_FULL", e.getErrorCode());
    }

    @Test
    void keysThatCouldReachOtherPathsAreRefused() throws GendoxException {
        hasRole(Role.INTERACT);

        for (String[] key : new String[][]{{"../x", "a"}, {"votes", "a/b"}, {"", "a"}, {"votes", ""},
                {"votes", ".."}, {"votes", "."}, {"votes", ".hidden"}}) {
            GendoxException e = assertThrows(GendoxException.class, () -> artifactDataService.set(artifact.getId(),
                    user, key[0], key[1], json("{}"), false, null));
            assertEquals("ARTIFACT_DATA_KEY_NOT_VALID", e.getErrorCode());
        }
    }

    @Test
    void deletingAPrivateDocumentDeletesOnlyTheReadersOwn() throws GendoxException {
        hasRole(Role.VIEW);
        ArtifactData mine = ArtifactData.builder().privateTo(user).build();
        when(artifactDataRepository.findByArtifactIdAndCollectionAndDocIdAndPrivateTo(artifact.getId(), "progress",
                "state", user)).thenReturn(Optional.of(mine));

        artifactDataService.delete(artifact.getId(), user, "progress", "state", true);

        ArgumentCaptor<ArtifactData> deleted = ArgumentCaptor.forClass(ArtifactData.class);
        verify(artifactDataRepository).delete(deleted.capture());
        assertSame(mine, deleted.getValue());
    }
}
