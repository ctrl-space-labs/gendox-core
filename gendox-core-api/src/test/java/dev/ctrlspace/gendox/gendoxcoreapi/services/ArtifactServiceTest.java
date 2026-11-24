package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactVersion;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts.ArtifactEditDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactThreadRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactVersionRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.MessageRepository;
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

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private ArtifactThreadRepository artifactThreadRepository;

    @Mock
    private ArtifactAccessService artifactAccessService;

    private final UUID threadId = UUID.randomUUID();
    private final UUID projectId = UUID.randomUUID();
    private final UUID messageId = UUID.randomUUID();

    private static Type type(String name) {
        return Type.builder().typeCategory("ARTIFACT_TYPE").name(name).build();
    }

    private static ArtifactEditDTO edit(String oldText, String newText) {
        return new ArtifactEditDTO(oldText, newText);
    }

    /**
     * An artifact made in another conversation, which this one was opened on; its user has the given role, or none.
     */
    private Artifact openedOn(Role role) {
        Artifact artifact = existing(1, "<h1>Old</h1>");
        artifact.setThreadId(UUID.randomUUID());
        UUID user = UUID.randomUUID();
        when(messageRepository.findFirstByThreadIdAndRoleOrderByCreatedAtDesc(threadId, "user"))
                .thenReturn(Optional.of(Message.builder().createdBy(user).build()));
        when(artifactThreadRepository.existsByArtifactIdAndThreadId(artifact.getId(), threadId)).thenReturn(true);
        when(artifactAccessService.roleOf(artifact, user)).thenReturn(Optional.ofNullable(role));
        return artifact;
    }

    private Artifact existing(int latestVersion, String latestContent) {
        Artifact artifact = Artifact.builder().id(UUID.randomUUID()).threadId(threadId).projectId(projectId)
                .title("Report").artifactType(type("HTML")).latestVersion(latestVersion).build();
        when(artifactRepository.lockById(artifact.getId())).thenReturn(Optional.of(artifact));
        when(artifactRepository.findById(artifact.getId())).thenReturn(Optional.of(artifact));
        when(artifactVersionRepository.findByArtifactIdAndVersion(artifact.getId(), latestVersion))
                .thenReturn(Optional.of(ArtifactVersion.builder().artifactId(artifact.getId())
                        .version(latestVersion).content(latestContent).build()));
        return artifact;
    }

    @BeforeEach
    void setUp() {
        when(typeService.getArtifactTypes()).thenReturn(List.of(type("HTML"), type("SVG"), type("MARKDOWN"), type("CODE")));
        lenient().when(typeService.getArtifactDisplays()).thenReturn(List.of(type("CARD"), type("INLINE")));
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
        Artifact artifact = artifactService.create(threadId, projectId, messageId, " Report ", "html", null, null, "<p>x</p>");

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
        Artifact code = artifactService.create(threadId, projectId, messageId, "Script", "code", "python", null, "print(1)");
        Artifact page = artifactService.create(threadId, projectId, messageId, "Page", "html", "python", null, "<p>x</p>");

        assertEquals("python", code.getCodeLanguage());
        assertNull(page.getCodeLanguage());
    }

    @Test
    void create_unknownKind_namesTheKindsThereAre() {
        GendoxException e = assertThrows(GendoxException.class,
                () -> artifactService.create(threadId, projectId, messageId, "Chart", "chart", null, null, "x"));

        assertEquals("ARTIFACT_TYPE_NOT_SUPPORTED", e.getErrorCode());
        assertTrue(e.getMessage().contains("code, html, markdown, svg"));
        verify(artifactRepository, never()).save(any());
    }

    @Test
    void create_contentOverTheLimit_fails() {
        ReflectionTestUtils.setField(artifactService, "maxContentLength", 10);

        GendoxException e = assertThrows(GendoxException.class,
                () -> artifactService.create(threadId, projectId, messageId, "Page", "html", null, null, "<p>too long</p>"));

        assertEquals("ARTIFACT_CONTENT_TOO_LONG", e.getErrorCode());
        verify(artifactRepository, never()).save(any());
    }

    // update

    @Test
    void update_withEdits_savesTheNextVersion() throws GendoxException {
        Artifact artifact = existing(3, "<h1>Old</h1>");

        Artifact updated = artifactService.update(threadId, artifact.getId(), messageId, null, null, null,
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

        Artifact updated = artifactService.update(threadId, artifact.getId(), messageId, "Renamed", null, null, null);

        assertEquals("Renamed", updated.getTitle());
        assertEquals(2, updated.getLatestVersion());
        verify(artifactVersionRepository, never()).save(any());
    }

    @Test
    void create_withoutADisplay_isACard() throws GendoxException {
        Artifact artifact = artifactService.create(threadId, projectId, messageId, "Page", "html", null, null, "<p>x</p>");

        assertNull(artifact.getDisplay());
    }

    @Test
    void create_inline_keepsItsDisplay_inAnyCase() throws GendoxException {
        Artifact artifact = artifactService.create(threadId, projectId, messageId, "Converter", "html", null, " Inline ", "<p>x</p>");

        assertEquals("INLINE", artifact.getDisplay().getName());
    }

    @Test
    void create_anUnknownDisplay_namesTheOnesThereAre() {
        GendoxException e = assertThrows(GendoxException.class,
                () -> artifactService.create(threadId, projectId, messageId, "Page", "html", null, "popup", "<p>x</p>"));

        assertEquals("ARTIFACT_DISPLAY_NOT_SUPPORTED", e.getErrorCode());
        assertTrue(e.getMessage().contains("card, inline"), e.getMessage());
    }

    @Test
    void update_displayOnly_changesItWithoutAVersion() throws GendoxException {
        Artifact artifact = existing(2, "<p>x</p>");

        Artifact updated = artifactService.update(threadId, artifact.getId(), messageId, null, "inline", null, null);

        assertEquals("INLINE", updated.getDisplay().getName());
        assertEquals(2, updated.getLatestVersion());
        verify(artifactVersionRepository, never()).save(any());
    }

    @Test
    void update_withoutADisplay_keepsTheOneItHas() throws GendoxException {
        Artifact artifact = existing(1, "<p>Old</p>");
        artifact.setDisplay(type("INLINE"));

        Artifact updated = artifactService.update(threadId, artifact.getId(), messageId, null, null, null,
                List.of(edit("Old", "New")));

        assertEquals("INLINE", updated.getDisplay().getName());
    }

    @Test
    void update_failedEdit_savesNothing() {
        Artifact artifact = existing(1, "<p>x</p>");

        assertThrows(GendoxException.class, () -> artifactService.update(threadId, artifact.getId(), messageId, null, null, null,
                List.of(edit("<p>x</p>", "<p>y</p>"), edit("missing", "z"))));

        assertEquals(1, artifact.getLatestVersion());
        verify(artifactVersionRepository, never()).save(any());
        verify(artifactRepository, never()).save(any());
    }

    @Test
    void update_contentAndEdits_isAmbiguous() {
        GendoxException e = assertThrows(GendoxException.class, () -> artifactService.update(threadId, UUID.randomUUID(),
                messageId, null, null, "<p>all</p>", List.of(edit("a", "b"))));

        assertEquals("ARTIFACT_UPDATE_AMBIGUOUS", e.getErrorCode());
    }

    @Test
    void update_nothingToChange_fails() {
        GendoxException e = assertThrows(GendoxException.class,
                () -> artifactService.update(threadId, UUID.randomUUID(), messageId, " ", null, null, List.of()));

        assertEquals("ARTIFACT_UPDATE_EMPTY", e.getErrorCode());
    }

    @Test
    void update_artifactOfAnotherThread_isNotFoundAndNamesThisThreadsArtifacts() {
        UUID otherThreadsArtifact = UUID.randomUUID();
        Artifact here = Artifact.builder().id(UUID.randomUUID()).threadId(threadId).title("Dashboard").build();
        when(artifactRepository.lockById(otherThreadsArtifact)).thenReturn(Optional.of(Artifact.builder()
                .id(otherThreadsArtifact).threadId(UUID.randomUUID()).title("Elsewhere").latestVersion(1).build()));
        when(artifactRepository.findAllByThreadIdOrderByCreatedAtAsc(threadId)).thenReturn(List.of(here));

        GendoxException e = assertThrows(GendoxException.class, () -> artifactService.update(threadId, otherThreadsArtifact,
                messageId, null, null, "<p>x</p>", null));

        assertEquals("ARTIFACT_NOT_FOUND", e.getErrorCode());
        assertTrue(e.getMessage().contains(here.getId() + " (Dashboard)"));
        verify(artifactVersionRepository, never()).save(any());
    }

    @Test
    void create_theAuthorOfTheTurnOwnsItAndWroteVersionOne() throws GendoxException {
        UUID author = UUID.randomUUID();
        when(messageRepository.findFirstByThreadIdAndRoleOrderByCreatedAtDesc(threadId, "user"))
                .thenReturn(Optional.of(Message.builder().createdBy(author).build()));

        Artifact artifact = artifactService.create(threadId, projectId, messageId, "Report", "html", null, null, "<h1>Hi</h1>");

        assertEquals(author, artifact.getOwnerId());
        ArgumentCaptor<ArtifactVersion> saved = ArgumentCaptor.forClass(ArtifactVersion.class);
        verify(artifactVersionRepository).save(saved.capture());
        assertEquals(author, saved.getValue().getCreatedBy());
    }

    @Test
    void update_theAuthorOfTheTurnWroteTheVersionAndTheOwnerStays() throws GendoxException {
        UUID owner = UUID.randomUUID();
        UUID author = UUID.randomUUID();
        Artifact artifact = existing(1, "<h1>Old</h1>");
        artifact.setOwnerId(owner);
        when(messageRepository.findFirstByThreadIdAndRoleOrderByCreatedAtDesc(threadId, "user"))
                .thenReturn(Optional.of(Message.builder().createdBy(author).build()));

        artifactService.update(threadId, artifact.getId(), messageId, null, null, null, List.of(edit("Old", "New")));

        assertEquals(owner, artifact.getOwnerId());
        ArgumentCaptor<ArtifactVersion> saved = ArgumentCaptor.forClass(ArtifactVersion.class);
        verify(artifactVersionRepository).save(saved.capture());
        assertEquals(author, saved.getValue().getCreatedBy());
    }

    // a conversation opened on an artifact made elsewhere

    @Test
    void update_onAnArtifactTheConversationWasOpenedOn_withEdit_savesTheNextVersion() throws GendoxException {
        Artifact artifact = openedOn(Role.EDIT);

        artifactService.update(threadId, artifact.getId(), messageId, null, null, null, List.of(edit("Old", "New")));

        ArgumentCaptor<ArtifactVersion> saved = ArgumentCaptor.forClass(ArtifactVersion.class);
        verify(artifactVersionRepository).save(saved.capture());
        assertEquals(2, saved.getValue().getVersion());
        assertEquals("<h1>New</h1>", saved.getValue().getContent());
    }

    @Test
    void update_onAnArtifactTheUserMayOnlyUse_isReadOnlyAndChangesNothing() {
        Artifact artifact = openedOn(Role.INTERACT);

        GendoxException e = assertThrows(GendoxException.class, () -> artifactService.update(threadId, artifact.getId(),
                messageId, "New title", null, null, null));

        assertEquals("ARTIFACT_READ_ONLY", e.getErrorCode());
        assertTrue(e.getErrorMessage().contains("EDIT"), e.getErrorMessage());
        assertEquals("Report", artifact.getTitle());
        verify(artifactVersionRepository, never()).save(any());
        verify(artifactRepository, never()).save(any());
    }

    @Test
    void read_anArtifactTheConversationWasOpenedOn_withView_isAllowed() throws GendoxException {
        Artifact artifact = openedOn(Role.VIEW);

        assertSame(artifact, artifactService.getByIdInThread(threadId, artifact.getId()));
    }

    @Test
    void read_anArtifactWhoseRoleWasTakenBack_isNotFound() {
        Artifact artifact = openedOn(null);

        GendoxException e = assertThrows(GendoxException.class,
                () -> artifactService.getByIdInThread(threadId, artifact.getId()));

        assertEquals("ARTIFACT_NOT_FOUND", e.getErrorCode());
    }

    @Test
    void read_anArtifactOfAnotherConversationNotOpenedHere_isNotFoundWhateverTheRole() {
        Artifact artifact = openedOn(Role.EDIT);
        when(artifactThreadRepository.existsByArtifactIdAndThreadId(artifact.getId(), threadId)).thenReturn(false);

        GendoxException e = assertThrows(GendoxException.class,
                () -> artifactService.getByIdInThread(threadId, artifact.getId()));

        assertEquals("ARTIFACT_NOT_FOUND", e.getErrorCode());
    }

    @Test
    void read_theConversationsOwnArtifact_needsNoRole() throws GendoxException {
        Artifact artifact = existing(1, "<h1>Old</h1>");

        assertSame(artifact, artifactService.getByIdInThread(threadId, artifact.getId()));
        verifyNoInteractions(artifactAccessService);
    }
}
