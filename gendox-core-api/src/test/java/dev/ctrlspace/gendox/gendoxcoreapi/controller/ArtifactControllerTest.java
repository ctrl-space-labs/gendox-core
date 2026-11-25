package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.ArtifactConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactVersion;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts.ArtifactDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts.ArtifactSummaryDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ArtifactCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ArtifactAccessService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ArtifactAccessService.Role;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ArtifactService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ArtifactControllerTest {

    private final UUID me = UUID.randomUUID();
    private final UUID projectId = UUID.randomUUID();
    private final UUID threadId = UUID.randomUUID();

    private ArtifactService artifactService;
    private ArtifactAccessService artifactAccessService;
    private Artifact artifact;
    private ArtifactController controller;

    @BeforeEach
    void setUp() {
        artifactService = mock(ArtifactService.class);
        SecurityUtils securityUtils = mock(SecurityUtils.class);
        when(securityUtils.getUserId()).thenReturn(me);
        artifactAccessService = mock(ArtifactAccessService.class);
        controller = new ArtifactController(artifactService, new ArtifactConverter(), securityUtils, artifactAccessService);

        artifact = Artifact.builder().id(UUID.randomUUID()).threadId(threadId).projectId(projectId)
                .title("Returns policy").artifactType(Type.builder().name("HTML").build()).latestVersion(2)
                .ownerId(me).build();
        when(artifactService.getAll(any(), any())).thenReturn(new PageImpl<>(List.of(artifact)));
        when(artifactService.threadNamesOf(any())).thenReturn(Map.of(threadId, "Returns policy card"));
    }

    @Test
    void theListIsAlwaysTheSignedInUsersInThePathsProject() throws GendoxException {
        // a request that tries to read someone else's artifacts in another project
        ArtifactCriteria fromRequest = ArtifactCriteria.builder()
                .projectId(UUID.randomUUID()).userId(UUID.randomUUID()).search("policy").build();

        controller.getAllByProject(UUID.randomUUID(), projectId, fromRequest, PageRequest.of(0, 20));

        ArgumentCaptor<ArtifactCriteria> used = ArgumentCaptor.forClass(ArtifactCriteria.class);
        verify(artifactService).getAll(used.capture(), any());
        assertEquals(projectId, used.getValue().getProjectId());
        assertEquals(me, used.getValue().getUserId());
        assertEquals("policy", used.getValue().getSearch());
    }

    @Test
    void eachRowNamesItsConversation() throws GendoxException {
        Page<ArtifactSummaryDTO> page = controller.getAllByProject(UUID.randomUUID(), projectId, new ArtifactCriteria(), PageRequest.of(0, 20));

        ArtifactSummaryDTO row = page.getContent().getFirst();
        assertEquals("Returns policy", row.getTitle());
        assertEquals("Returns policy card", row.getThreadName());
        assertEquals("HTML", row.getArtifactType().getName());
    }

    @Test
    void aRowSharedByAnotherHidesTheirConversation() throws GendoxException {
        UUID owner = UUID.randomUUID();
        Artifact theirs = Artifact.builder().id(UUID.randomUUID()).threadId(UUID.randomUUID()).projectId(projectId)
                .title("Their page").artifactType(Type.builder().name("HTML").build()).latestVersion(1)
                .ownerId(owner).build();
        when(artifactService.getAll(any(), any())).thenReturn(new PageImpl<>(List.of(theirs)));
        when(artifactService.ownerNamesOf(any())).thenReturn(Map.of(owner, "Maria"));

        Page<ArtifactSummaryDTO> page = controller.getAllByProject(UUID.randomUUID(), projectId,
                ArtifactCriteria.builder().sharedWithMe(true).build(), PageRequest.of(0, 20));

        ArtifactSummaryDTO row = page.getContent().getFirst();
        assertNull(row.getThreadId());
        assertNull(row.getThreadName());
        assertEquals("Maria", row.getOwnerName());
    }

    @Test
    void lastChangedComesFirstUnlessAnotherOrderIsAsked() throws GendoxException {
        controller.getAllByProject(UUID.randomUUID(), projectId, new ArtifactCriteria(), PageRequest.of(0, 20));

        ArgumentCaptor<Pageable> used = ArgumentCaptor.forClass(Pageable.class);
        verify(artifactService).getAll(any(), used.capture());
        assertEquals(Sort.by(Sort.Direction.DESC, "updatedAt"), used.getValue().getSort());
    }

    @Test
    void moreThanAHundredAPageIsRefused() {
        GendoxException e = assertThrows(GendoxException.class,
                () -> controller.getAllByProject(UUID.randomUUID(), projectId, new ArtifactCriteria(), PageRequest.of(0, 101)));

        assertEquals("MAX_PAGE_SIZE_EXCEED", e.getErrorCode());
        verify(artifactService, never()).getAll(any(), any());
    }

    private void opens(Role role) throws GendoxException {
        ArtifactVersion latest = ArtifactVersion.builder().version(2).content("<h1>Hi</h1>").build();
        when(artifactService.getByIdInThread(threadId, artifact.getId())).thenReturn(artifact);
        when(artifactService.open(artifact.getId(), me)).thenReturn(new ArtifactService.Opened(artifact, role));
        when(artifactService.getVersion(any(), any())).thenReturn(latest);
        when(artifactService.getVersionSummaries(artifact.getId())).thenReturn(List.of());
        when(artifactAccessService.roleOf(artifact, me)).thenReturn(Optional.ofNullable(role));
    }

    @Test
    void anArtifactReadInItsConversationCarriesTheReadersRole() throws GendoxException {
        opens(Role.OWNER);

        ArtifactDTO read = controller.getById(threadId, artifact.getId());

        assertEquals("OWNER", read.getYourRole());
        assertEquals("<h1>Hi</h1>", read.getContent());
    }

    @Test
    void aReaderOfAPublicConversationWithoutARoleGetsNone() throws GendoxException {
        opens(null);

        assertNull(controller.getById(threadId, artifact.getId()).getYourRole());
    }

    @Test
    void anArtifactOpenedByItsIdCarriesTheRoleAndItsConversationOnlyForItsOwner() throws GendoxException {
        opens(Role.EDIT);

        ArtifactDTO opened = controller.open(artifact.getId());

        assertEquals("EDIT", opened.getYourRole());
        assertNull(opened.getThreadId());

        opens(Role.OWNER);
        assertEquals(threadId, controller.open(artifact.getId()).getThreadId());
    }

    @Test
    void readInAnotherConversationItHidesTheOwnersConversationFromAnyoneButTheOwner() throws GendoxException {
        UUID openedOnIt = UUID.randomUUID();
        opens(Role.EDIT);
        when(artifactService.getByIdInThread(openedOnIt, artifact.getId())).thenReturn(artifact);

        assertNull(controller.getById(openedOnIt, artifact.getId()).getThreadId());
        // in the conversation it was made in, that conversation is the one being read
        assertEquals(threadId, controller.getById(threadId, artifact.getId()).getThreadId());

        opens(Role.OWNER);
        when(artifactService.getByIdInThread(openedOnIt, artifact.getId())).thenReturn(artifact);
        assertEquals(threadId, controller.getById(openedOnIt, artifact.getId()).getThreadId());
    }

    @Test
    void aRestoredVersionAnswersWithTheArtifactAtItsLatest() throws GendoxException {
        opens(Role.EDIT);

        ArtifactDTO restored = controller.restoreVersion(artifact.getId(), 1);

        verify(artifactService).restoreVersion(artifact.getId(), me, 1);
        assertEquals("EDIT", restored.getYourRole());
    }
}
