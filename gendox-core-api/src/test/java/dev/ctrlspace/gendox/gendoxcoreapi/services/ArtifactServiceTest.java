package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactVersion;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ArtifactEditDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactVersionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ArtifactServiceTest {

    @InjectMocks
    private ArtifactService artifactService;

    @Mock
    private ArtifactRepository artifactRepository;

    @Mock
    private ArtifactVersionRepository artifactVersionRepository;

    @Mock
    private TypeService typeService;

    private final UUID threadId = UUID.randomUUID();
    private final UUID projectId = UUID.randomUUID();
    private final UUID messageId = UUID.randomUUID();

    private static Type type(String name) {
        return Type.builder().typeCategory("ARTIFACT_TYPE").name(name).build();
    }

    private static ArtifactEditDTO edit(String oldText, String newText) {
        return new ArtifactEditDTO(oldText, newText);
    }

    private Artifact existing(int latestVersion, String latestContent) {
        Artifact artifact = Artifact.builder().id(UUID.randomUUID()).threadId(threadId).projectId(projectId)
                .title("Report").artifactType(type("HTML")).latestVersion(latestVersion).build();
        when(artifactRepository.lockByIdAndThreadId(artifact.getId(), threadId)).thenReturn(Optional.of(artifact));
        when(artifactVersionRepository.findByArtifactIdAndVersion(artifact.getId(), latestVersion))
                .thenReturn(Optional.of(ArtifactVersion.builder().artifactId(artifact.getId())
                        .version(latestVersion).content(latestContent).build()));
        return artifact;
    }

    @BeforeEach
    void setUp() {
        when(typeService.getArtifactTypes()).thenReturn(List.of(type("HTML"), type("SVG"), type("MARKDOWN"), type("CODE")));
        when(artifactRepository.save(any(Artifact.class))).thenAnswer(invocation -> {
            Artifact artifact = invocation.getArgument(0);
            if (artifact.getId() == null) {
                artifact.setId(UUID.randomUUID());
            }
            return artifact;
        });
    }

    // applyEdits

    @Test
    void applyEdits_replacesTheOnlyOccurrence() throws GendoxException {
        String result = ArtifactService.applyEdits("<h1>Old</h1><p>Body</p>", List.of(edit("<h1>Old</h1>", "<h1>New</h1>")));

        assertEquals("<h1>New</h1><p>Body</p>", result);
    }

    @Test
    void applyEdits_appliesEachEditOnTheResultOfTheOneBefore() throws GendoxException {
        String result = ArtifactService.applyEdits("a b c", List.of(edit("a", "x y"), edit("x y b", "z")));

        assertEquals("z c", result);
    }

    @Test
    void applyEdits_emptyNewTextDeletes() throws GendoxException {
        String result = ArtifactService.applyEdits("keep<br>keep", List.of(edit("<br>", "")));

        assertEquals("keepkeep", result);
    }

    @Test
    void applyEdits_oldTextNotFound_failsAndPointsToReadArtifact() {
        GendoxException e = assertThrows(GendoxException.class,
                () -> ArtifactService.applyEdits("abc", List.of(edit("abc", "x"), edit("missing", "y"))));

        assertEquals("ARTIFACT_EDIT_NOT_FOUND", e.getErrorCode());
        assertTrue(e.getMessage().contains("Edit 2"));
        assertTrue(e.getMessage().contains("read_artifact"));
    }

    @Test
    void applyEdits_oldTextNotUnique_fails() {
        GendoxException e = assertThrows(GendoxException.class,
                () -> ArtifactService.applyEdits("<li>x</li><li>x</li>", List.of(edit("<li>x</li>", "<li>y</li>"))));

        assertEquals("ARTIFACT_EDIT_NOT_UNIQUE", e.getErrorCode());
    }

    @Test
    void applyEdits_emptyOldText_fails() {
        GendoxException e = assertThrows(GendoxException.class,
                () -> ArtifactService.applyEdits("abc", List.of(edit("", "x"))));

        assertEquals("ARTIFACT_EDIT_INVALID", e.getErrorCode());
    }

    // create

    @Test
    void create_savesVersionOneWithTheTypeInAnyCase() throws GendoxException {
        Artifact artifact = artifactService.create(threadId, projectId, messageId, " Report ", "html", null, "<p>x</p>");

        assertEquals("HTML", artifact.getArtifactType().getName());
        assertEquals("Report", artifact.getTitle());
        assertEquals(1, artifact.getLatestVersion());

        ArgumentCaptor<ArtifactVersion> saved = ArgumentCaptor.forClass(ArtifactVersion.class);
        verify(artifactVersionRepository).save(saved.capture());
        assertEquals(1, saved.getValue().getVersion());
        assertEquals("<p>x</p>", saved.getValue().getContent());
        assertEquals(messageId, saved.getValue().getMessageId());
    }

    @Test
    void create_keepsCodeLanguageForCodeOnly() throws GendoxException {
        Artifact code = artifactService.create(threadId, projectId, messageId, "Script", "code", "python", "print(1)");
        Artifact page = artifactService.create(threadId, projectId, messageId, "Page", "html", "python", "<p>x</p>");

        assertEquals("python", code.getCodeLanguage());
        assertNull(page.getCodeLanguage());
    }

    @Test
    void create_unknownKind_namesTheKindsThereAre() {
        GendoxException e = assertThrows(GendoxException.class,
                () -> artifactService.create(threadId, projectId, messageId, "Chart", "chart", null, "x"));

        assertEquals("ARTIFACT_TYPE_NOT_SUPPORTED", e.getErrorCode());
        assertTrue(e.getMessage().contains("code, html, markdown, svg"));
        verify(artifactRepository, never()).save(any());
    }

    @Test
    void create_contentOverTheLimit_fails() {
        ReflectionTestUtils.setField(artifactService, "maxContentLength", 10);

        GendoxException e = assertThrows(GendoxException.class,
                () -> artifactService.create(threadId, projectId, messageId, "Page", "html", null, "<p>too long</p>"));

        assertEquals("ARTIFACT_CONTENT_TOO_LONG", e.getErrorCode());
        verify(artifactRepository, never()).save(any());
    }

    // update

    @Test
    void update_withEdits_savesTheNextVersion() throws GendoxException {
        Artifact artifact = existing(3, "<h1>Old</h1>");

        Artifact updated = artifactService.update(threadId, artifact.getId(), messageId, null, null,
                List.of(edit("Old", "New")));

        assertEquals(4, updated.getLatestVersion());
        ArgumentCaptor<ArtifactVersion> saved = ArgumentCaptor.forClass(ArtifactVersion.class);
        verify(artifactVersionRepository).save(saved.capture());
        assertEquals(4, saved.getValue().getVersion());
        assertEquals("<h1>New</h1>", saved.getValue().getContent());
    }

    @Test
    void update_titleOnly_renamesWithoutAVersion() throws GendoxException {
        Artifact artifact = existing(2, "<p>x</p>");

        Artifact updated = artifactService.update(threadId, artifact.getId(), messageId, "Renamed", null, null);

        assertEquals("Renamed", updated.getTitle());
        assertEquals(2, updated.getLatestVersion());
        verify(artifactVersionRepository, never()).save(any());
    }

    @Test
    void update_failedEdit_savesNothing() {
        Artifact artifact = existing(1, "<p>x</p>");

        assertThrows(GendoxException.class, () -> artifactService.update(threadId, artifact.getId(), messageId, null, null,
                List.of(edit("<p>x</p>", "<p>y</p>"), edit("missing", "z"))));

        assertEquals(1, artifact.getLatestVersion());
        verify(artifactVersionRepository, never()).save(any());
        verify(artifactRepository, never()).save(any());
    }

    @Test
    void update_contentAndEdits_isAmbiguous() {
        GendoxException e = assertThrows(GendoxException.class, () -> artifactService.update(threadId, UUID.randomUUID(),
                messageId, null, "<p>all</p>", List.of(edit("a", "b"))));

        assertEquals("ARTIFACT_UPDATE_AMBIGUOUS", e.getErrorCode());
    }

    @Test
    void update_nothingToChange_fails() {
        GendoxException e = assertThrows(GendoxException.class,
                () -> artifactService.update(threadId, UUID.randomUUID(), messageId, " ", null, List.of()));

        assertEquals("ARTIFACT_UPDATE_EMPTY", e.getErrorCode());
    }

    @Test
    void update_artifactOfAnotherThread_isNotFoundAndNamesThisThreadsArtifacts() {
        UUID otherThreadsArtifact = UUID.randomUUID();
        Artifact here = Artifact.builder().id(UUID.randomUUID()).threadId(threadId).title("Dashboard").build();
        when(artifactRepository.lockByIdAndThreadId(otherThreadsArtifact, threadId)).thenReturn(Optional.empty());
        when(artifactRepository.findAllByThreadIdOrderByCreatedAtAsc(threadId)).thenReturn(List.of(here));

        GendoxException e = assertThrows(GendoxException.class, () -> artifactService.update(threadId, otherThreadsArtifact,
                messageId, null, "<p>x</p>", null));

        assertEquals("ARTIFACT_NOT_FOUND", e.getErrorCode());
        assertTrue(e.getMessage().contains(here.getId() + " (Dashboard)"));
        verify(artifactVersionRepository, never()).save(any());
    }
}