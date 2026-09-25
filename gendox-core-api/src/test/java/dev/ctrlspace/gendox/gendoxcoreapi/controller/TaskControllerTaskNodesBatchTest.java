package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.TaskNodeConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskNodeService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TaskControllerTaskNodesBatchTest {

    @InjectMocks
    private TaskController taskController;

    @Mock
    private TaskService taskService;

    @Mock
    private TaskNodeService taskNodeService;

    @Mock
    private TaskNodeConverter taskNodeConverter;

    private final UUID projectId = UUID.randomUUID();

    private Task task(UUID projectId) {
        Task task = new Task();
        task.setId(UUID.randomUUID());
        task.setProjectId(projectId);
        return task;
    }

    private TaskNodeDTO node(UUID taskId) {
        TaskNodeDTO dto = new TaskNodeDTO();
        dto.setTaskId(taskId);
        dto.setNodeType("DOCUMENT");
        dto.setDocumentId(UUID.randomUUID());
        return dto;
    }

    @Test
    void createTaskNodesBatch_nodeForTaskOfAnotherProject_isRejected() throws GendoxException {
        Task ownTask = task(projectId);
        Task foreignTask = task(UUID.randomUUID());
        when(taskService.getTaskById(ownTask.getId())).thenReturn(ownTask);
        when(taskService.getTaskById(foreignTask.getId())).thenReturn(foreignTask);

        assertThrows(GendoxException.class, () -> taskController.createTaskNodesBatch(
                UUID.randomUUID(), projectId, List.of(node(ownTask.getId()), node(foreignTask.getId()))));

        verify(taskNodeService, never()).createTaskNodesBatch(any());
    }

    @Test
    void createTaskNode_documentFromAnotherProject_isRejected() throws GendoxException {
        Task ownTask = task(projectId);
        TaskNodeDTO dto = node(ownTask.getId());
        when(taskService.getTaskById(ownTask.getId())).thenReturn(ownTask);
        doThrow(new GendoxException("DOCUMENT_NOT_IN_PROJECT", "", HttpStatus.FORBIDDEN))
                .when(taskNodeService).validateNodeDocumentsAccessible(List.of(dto), projectId);

        assertThrows(GendoxException.class, () -> taskController.createTaskNode(UUID.randomUUID(), projectId, dto));

        verify(taskNodeService, never()).createTaskNode(any());
    }

    @Test
    void createTaskNode_documentFromSameProject_isCreated() throws GendoxException {
        Task ownTask = task(projectId);
        TaskNodeDTO dto = node(ownTask.getId());
        when(taskService.getTaskById(ownTask.getId())).thenReturn(ownTask);

        taskController.createTaskNode(UUID.randomUUID(), projectId, dto);

        verify(taskNodeService).validateNodeDocumentsAccessible(List.of(dto), projectId);
        verify(taskNodeService).createTaskNode(any());
    }
}
