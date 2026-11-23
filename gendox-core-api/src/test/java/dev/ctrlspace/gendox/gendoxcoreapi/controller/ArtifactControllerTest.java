package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.ArtifactConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ArtifactSummaryDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ArtifactCriteria;
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
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ArtifactControllerTest {

    private final UUID me = UUID.randomUUID();
    private final UUID projectId = UUID.randomUUID();
    private final UUID threadId = UUID.randomUUID();

    private ArtifactService artifactService;
    private ArtifactController controller;

    @BeforeEach
    void setUp() {
        artifactService = mock(ArtifactService.class);
        SecurityUtils securityUtils = mock(SecurityUtils.class);
        when(securityUtils.getUserId()).thenReturn(me);
        controller = new ArtifactController(artifactService, new ArtifactConverter(), securityUtils);

        Artifact artifact = Artifact.builder().id(UUID.randomUUID()).threadId(threadId).projectId(projectId)
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
}