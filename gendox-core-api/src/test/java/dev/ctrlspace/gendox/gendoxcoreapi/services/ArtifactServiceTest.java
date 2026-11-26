package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactVersion;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts.ArtifactEditDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactThreadRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ChatThreadRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactVersionRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.MessageRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ArtifactAccessService.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.ObjectMapper;
import org.mockito.Spy;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ArtifactServiceTest {

    // a real one: the service reads what the artifact tools returned
    @Spy
    private ObjectMapper objectMapper = JsonMapper.builder().build();

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

    @Mock
    private ChatThreadRepository chatThreadRepository;

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

    @Test
    void checkWidget_aPageOrADrawing_passesAndStoresNothing() throws GendoxException {
        artifactService.checkWidget(" HTML ", "<p>x</p>");
        artifactService.checkWidget("svg", "<svg/>");

        verifyNoInteractions(artifactRepository, artifactVersionRepository);
    }

    @Test
    void checkWidget_anotherKind_namesTheOnesThereAre() {
        GendoxException e = assertThrows(GendoxException.class, () -> artifactService.checkWidget("markdown", "# x"));

        assertEquals("WIDGET_KIND_NOT_SUPPORTED", e.getErrorCode());
        assertTrue(e.getMessage().contains("html, svg"), e.getMessage());
    }

    @Test
    void checkWidget_overTheLimit_failsAsAnArtifactWould() {
        ReflectionTestUtils.setField(artifactService, "maxContentLength", 10);

        GendoxException e = assertThrows(GendoxException.class,
                () -> artifactService.checkWidget("html", "<p>too long</p>"));

        assertEquals("ARTIFACT_CONTENT_TOO_LONG", e.getErrorCode());
    }

    @Test
    void aPublicThreadMayNotHaveArtifacts_aMembersThreadMay() throws GendoxException {
        UUID publicThread = UUID.randomUUID();
        when(chatThreadRepository.existsByIdAndPublicThreadIsTrue(publicThread)).thenReturn(true);

        assertFalse(artifactService.artifactsAllowedIn(publicThread));
        assertFalse(artifactService.artifactsAllowedIn(null));
        assertTrue(artifactService.artifactsAllowedIn(threadId));
        GendoxException e = assertThrows(GendoxException.class,
                () -> artifactService.requireArtifactsAllowedIn(publicThread));
        assertEquals("ARTIFACTS_NOT_IN_PUBLIC_THREADS", e.getErrorCode());
    }

    @Test
    void update_refused_changesNeitherItsTitleNorItsCapabilities() throws GendoxException {
        Artifact artifact = existing(1, "<p>Old</p>");

        // the edit's text is not in the artifact, so the update is refused
        assertThrows(GendoxException.class, () -> artifactService.update(threadId, artifact.getId(), messageId,
                "New title", List.of("data"), null, List.of(edit("missing", "x"))));

        assertEquals("Report", artifact.getTitle());
        assertNull(artifact.getCapabilities());
        assertEquals(1, artifact.getLatestVersion());
        verify(artifactRepository, never()).save(any());
    }

    @Test
    void create_withCapabilities_keepsThemOnceInTheirOrder() throws GendoxException {
        Artifact artifact = artifactService.create(threadId, projectId, messageId, "Poll", "html", null,
                List.of(" USER ", "data", "data"), "<p>x</p>");

        assertEquals(List.of("data", "user"), artifact.getCapabilities());
    }

    @Test
    void create_withAnUnknownCapability_namesTheOnesThereAre() {
        GendoxException e = assertThrows(GendoxException.class, () -> artifactService.create(threadId, projectId,
                messageId, "Poll", "html", null, List.of("network"), "<p>x</p>"));

        assertEquals("ARTIFACT_CAPABILITY_NOT_SUPPORTED", e.getErrorCode());
        assertTrue(e.getMessage().contains("data, user"), e.getMessage());
        verify(artifactRepository, never()).save(any());
    }

    @Test
    void update_capabilitiesOnly_changesThemWithoutAVersion_andAnEmptyListTakesThemAway() throws GendoxException {
        Artifact artifact = existing(2, "<p>x</p>");

        Artifact updated = artifactService.update(threadId, artifact.getId(), messageId, null, List.of("data"), null, null);
        assertEquals(List.of("data"), updated.getCapabilities());
        assertEquals(2, updated.getLatestVersion());

        updated = artifactService.update(threadId, artifact.getId(), messageId, null, List.of(), null, null);
        assertNull(updated.getCapabilities());
        verify(artifactVersionRepository, never()).save(any());
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

    private void toolResultsInThread(String... results) {
        List<Message> messages = new ArrayList<>();
        for (String result : results) {
            Message message = new Message();
            message.setRole("tool");
            message.setValue(result);
            messages.add(message);
        }
        when(messageRepository.findAllByThreadIdAndRoleAndNameIn(eq(threadId), eq("tool"), any())).thenReturn(messages);
    }

    private static String resultOf(Artifact artifact, int version) {
        return "{\"artifactId\":\"" + artifact.getId() + "\",\"version\":" + version + "}";
    }

    @Test
    void update_wholeContent_afterTheConversationSawTheLatest_isTaken() throws GendoxException {
        Artifact artifact = existing(3, "<p>v3</p>");
        toolResultsInThread(resultOf(artifact, 1), resultOf(artifact, 3), "not json");

        Artifact updated = artifactService.update(threadId, artifact.getId(), messageId, null, null, "<p>v4</p>", null);

        assertEquals(4, updated.getLatestVersion());
    }

    @Test
    void update_wholeContent_whenSomeoneChangedItSince_isRefusedAndSavesNothing() {
        Artifact artifact = existing(3, "<p>v3</p>");
        // this conversation saw version 2; another made version 3; another artifact's result does not count
        toolResultsInThread(resultOf(artifact, 2), resultOf(Artifact.builder().id(UUID.randomUUID()).build(), 9));

        GendoxException e = assertThrows(GendoxException.class,
                () -> artifactService.update(threadId, artifact.getId(), messageId, null, null, "<p>mine</p>", null));

        assertEquals("ARTIFACT_CHANGED_SINCE_READ", e.getErrorCode());
        assertTrue(e.getMessage().contains("last saw version 2"), e.getMessage());
        assertEquals(3, artifact.getLatestVersion());
        verify(artifactVersionRepository, never()).save(any());
    }

    @Test
    void update_wholeContent_ofAnArtifactNeverRead_isRefused() {
        Artifact artifact = existing(1, "<p>x</p>");
        toolResultsInThread();

        GendoxException e = assertThrows(GendoxException.class,
                () -> artifactService.update(threadId, artifact.getId(), messageId, null, null, "<p>y</p>", null));

        assertEquals("ARTIFACT_CHANGED_SINCE_READ", e.getErrorCode());
        assertTrue(e.getMessage().contains("has not read"), e.getMessage());
    }

    @Test
    void update_edits_needNoReading_theyFailOnTheirOwnWhenTheTextIsGone() throws GendoxException {
        Artifact artifact = existing(3, "<p>Old</p>");
        toolResultsInThread(resultOf(artifact, 1));

        Artifact updated = artifactService.update(threadId, artifact.getId(), messageId, null, null, null,
                List.of(edit("Old", "New")));

        assertEquals(4, updated.getLatestVersion());
    }

    @Test
    void restoreVersion_bringsAnEarlierOneBackAsANewVersion_byThePerson() throws GendoxException {
        Artifact artifact = existing(3, "<p>v3</p>");
        when(artifactVersionRepository.findByArtifactIdAndVersion(artifact.getId(), 1))
                .thenReturn(Optional.of(ArtifactVersion.builder().artifactId(artifact.getId()).version(1).content("<p>v1</p>").build()));
        UUID editor = UUID.randomUUID();
        when(artifactAccessService.require(artifact, editor, Role.EDIT)).thenReturn(Role.EDIT);

        ArtifactService.Opened opened = artifactService.restoreVersion(artifact.getId(), editor, 1);

        assertEquals(4, opened.artifact().getLatestVersion());
        ArgumentCaptor<ArtifactVersion> saved = ArgumentCaptor.forClass(ArtifactVersion.class);
        verify(artifactVersionRepository).save(saved.capture());
        assertEquals(4, saved.getValue().getVersion());
        assertEquals("<p>v1</p>", saved.getValue().getContent());
        assertEquals(editor, saved.getValue().getCreatedBy());
        assertNull(saved.getValue().getMessageId());
    }

    @Test
    void restoreVersion_ofTheLatest_changesNothing() throws GendoxException {
        Artifact artifact = existing(3, "<p>v3</p>");
        UUID editor = UUID.randomUUID();
        when(artifactAccessService.require(artifact, editor, Role.EDIT)).thenReturn(Role.OWNER);

        artifactService.restoreVersion(artifact.getId(), editor, 3);

        assertEquals(3, artifact.getLatestVersion());
        verify(artifactVersionRepository, never()).save(any());
    }

    @Test
    void restoreVersion_belowEditor_isRefused() throws GendoxException {
        Artifact artifact = existing(3, "<p>v3</p>");
        UUID viewer = UUID.randomUUID();
        when(artifactAccessService.require(artifact, viewer, Role.EDIT))
                .thenThrow(new GendoxException("ARTIFACT_ROLE_TOO_LOW", "Viewer", org.springframework.http.HttpStatus.FORBIDDEN));

        assertThrows(GendoxException.class, () -> artifactService.restoreVersion(artifact.getId(), viewer, 1));

        assertEquals(3, artifact.getLatestVersion());
        verify(artifactVersionRepository, never()).save(any());
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
