package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskDocumentMetadataDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeValueDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TaskNodeRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TaskNodeServiceDocumentAccessTest {

    @InjectMocks
    private TaskNodeService taskNodeService;

    @Mock
    private TaskNodeRepository taskNodeRepository;

    @Mock
    private SecurityUtils securityUtils;

    private final UUID projectId = UUID.randomUUID();
    private final UUID taskId = UUID.randomUUID();

    private TaskNodeDTO documentNode(UUID documentId, List<UUID> supportingDocumentIds) {
        TaskDocumentMetadataDTO metadata = new TaskDocumentMetadataDTO();
        metadata.setSupportingDocumentIds(supportingDocumentIds);
        TaskNodeValueDTO value = new TaskNodeValueDTO();
        value.setDocumentMetadata(metadata);

        TaskNodeDTO dto = new TaskNodeDTO();
        dto.setTaskId(taskId);
        dto.setNodeType("DOCUMENT");
        dto.setDocumentId(documentId);
        dto.setNodeValue(value);
        return dto;
    }

    @Test
    void documentFromAnotherProject_isRejected() {
        UUID foreignDocId = UUID.randomUUID();
        when(securityUtils.areAllDocumentsInAnyProject(
                List.of(foreignDocId), List.of(projectId))).thenReturn(false);

        GendoxException ex = assertThrows(GendoxException.class,
                () -> taskNodeService.validateNodeDocumentsAccessible(List.of(documentNode(foreignDocId, List.of())), projectId));

        assertEquals(HttpStatus.FORBIDDEN, ex.getHttpStatus());
    }

    @Test
    void supportingDocumentFromAnotherProject_isRejected() {
        UUID ownDocId = UUID.randomUUID();
        UUID foreignDocId = UUID.randomUUID();
        when(securityUtils.areAllDocumentsInAnyProject(
                List.of(ownDocId, foreignDocId), List.of(projectId))).thenReturn(false);

        assertThrows(GendoxException.class, () -> taskNodeService.validateNodeDocumentsAccessible(
                List.of(documentNode(ownDocId, List.of(foreignDocId))), projectId));
    }

    @Test
    void documentsFromSameProject_areAccepted() {
        UUID ownDocId = UUID.randomUUID();
        UUID supportingDocId = UUID.randomUUID();
        when(securityUtils.areAllDocumentsInAnyProject(
                List.of(ownDocId, supportingDocId), List.of(projectId))).thenReturn(true);

        assertDoesNotThrow(() -> taskNodeService.validateNodeDocumentsAccessible(
                List.of(documentNode(ownDocId, List.of(supportingDocId))), projectId));
    }

    @Test
    void batch_isValidatedInOneQuery() {
        UUID doc1 = UUID.randomUUID();
        UUID doc2 = UUID.randomUUID();
        when(securityUtils.areAllDocumentsInAnyProject(
                List.of(doc1, doc2), List.of(projectId))).thenReturn(false);

        assertThrows(GendoxException.class, () -> taskNodeService.validateNodeDocumentsAccessible(
                List.of(documentNode(doc1, List.of()), documentNode(doc2, List.of())), projectId));

        verify(securityUtils, times(1)).areAllDocumentsInAnyProject(any(), any());
    }

    @Test
    void nodesWithoutDocuments_skipQuery() throws GendoxException {
        taskNodeService.validateNodeDocumentsAccessible(List.of(documentNode(null, null)), projectId);

        verifyNoInteractions(securityUtils);
    }

    @Test
    void updateTaskNode_nodeOfAnotherTask_isRejected() {
        TaskNode existing = new TaskNode();
        existing.setId(UUID.randomUUID());
        existing.setTaskId(UUID.randomUUID());
        Task task = new Task();
        task.setId(taskId);
        task.setProjectId(projectId);
        TaskNodeDTO dto = new TaskNodeDTO();
        dto.setId(existing.getId());
        dto.setTaskId(taskId);

        when(taskNodeRepository.findById(existing.getId())).thenReturn(Optional.of(existing));

        assertThrows(GendoxException.class, () -> taskNodeService.updateTaskNode(dto, task));
        verify(taskNodeRepository, never()).save(any());
    }
}
