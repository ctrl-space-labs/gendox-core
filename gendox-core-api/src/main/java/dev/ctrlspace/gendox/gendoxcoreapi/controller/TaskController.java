package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.TaskEdgeConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.TaskNodeConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskEdge;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskEdgeDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskEdgeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskCsvExportService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskEdgeService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskNodeService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskService;
import lombok.SneakyThrows;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;


@RestController
public class TaskController {
    Logger logger = LoggerFactory.getLogger(TaskController.class);
    private final TaskService taskService;
    private final TaskNodeConverter taskNodeConverter;
    private final TaskEdgeConverter taskEdgeConverter;
    private final TaskCsvExportService taskCsvExportService;
    private final TaskNodeService taskNodeService;
    private final TaskEdgeService taskEdgeService;


    @Autowired
    public TaskController(TaskService taskService,
                          TaskNodeConverter taskNodeConverter,
                          TaskEdgeConverter taskEdgeConverter,
                          TaskCsvExportService taskCsvExportService,
                          TaskNodeService taskNodeService,
                          TaskEdgeService taskEdgeService) {
        this.taskService = taskService;
        this.taskNodeConverter = taskNodeConverter;
        this.taskEdgeConverter = taskEdgeConverter;
        this.taskCsvExportService = taskCsvExportService;
        this.taskNodeService = taskNodeService;
        this.taskEdgeService = taskEdgeService;
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @PostMapping(value = "/organizations/{organizationId}/projects/{projectId}/tasks")
    @ResponseStatus(value = HttpStatus.CREATED)
    public Task createTask(@PathVariable UUID organizationId,
                           @PathVariable UUID projectId,
                           @RequestBody TaskDTO taskDTO) {
        return taskService.createTask(projectId, taskDTO);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @GetMapping(value = "/organizations/{organizationId}/projects/{projectId}/tasks", produces = {"application/json"})
    @ResponseStatus(value = HttpStatus.OK)
    public List<Task> getAllTasks(@PathVariable UUID organizationId,
                                  @PathVariable UUID projectId) {
        return taskService.getAllTasksByProjectId(projectId);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @GetMapping(value = "/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}", produces = {"application/json"})
    @ResponseStatus(value = HttpStatus.OK)
    public Task getTaskById(@PathVariable UUID organizationId,
                            @PathVariable UUID projectId,
                            @PathVariable UUID taskId) {
        return taskService.getTaskById(taskId);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @PutMapping(value = "/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}")
    @ResponseStatus(value = HttpStatus.OK)
    public Task updateTask(@PathVariable UUID organizationId,
                           @PathVariable UUID projectId,
                           @PathVariable UUID taskId,
                           @RequestBody TaskDTO taskDTO) {
        return taskService.updateTask(taskId, taskDTO);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @PostMapping(value = "/organizations/{organizationId}/projects/{projectId}/task-nodes")
    @ResponseStatus(value = HttpStatus.CREATED)
    public TaskNode createTaskNode(@PathVariable UUID organizationId,
                                   @PathVariable UUID projectId,
                                   @RequestBody TaskNodeDTO taskNodeDTO) throws GendoxException {
        TaskNode taskNode = taskNodeConverter.toEntity(taskNodeDTO);
        return taskNodeService.createTaskNode(taskNode);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @PostMapping(value = "/organizations/{organizationId}/projects/{projectId}/task-nodes/batch")
    @ResponseStatus(value = HttpStatus.CREATED)
    public List<TaskNode> createTaskNodesBatch(@PathVariable UUID organizationId,
                                               @PathVariable UUID projectId,
                                               @RequestBody List<TaskNodeDTO> taskNodeDTOs) throws GendoxException {

        try {
            List<TaskNode> nodes = new ArrayList<>();
            for (TaskNodeDTO dto : taskNodeDTOs) {
                TaskNode node = taskNodeConverter.toEntity(dto);
                nodes.add(node);
            }
            return taskNodeService.createTaskNodesBatch(nodes);
        } catch (Exception e) {
            logger.error("Error creating task nodes batch: {}", e.getMessage(), e);
            throw new GendoxException("BATCH_CREATION_FAILED", "Failed to create task nodes batch", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @PutMapping(value = "/organizations/{organizationId}/projects/{projectId}/task-nodes")
    @ResponseStatus(value = HttpStatus.OK)
    public TaskNode updateTaskNode(@PathVariable UUID organizationId,
                                   @PathVariable UUID projectId,
                                   @RequestBody TaskNodeDTO taskNodeDTO) throws GendoxException {
        TaskNode taskNode = taskNodeConverter.toEntity(taskNodeDTO);
        return taskNodeService.updateTaskNode(taskNode);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @GetMapping(value = "/organizations/{organizationId}/projects/{projectId}/task-nodes", produces = {"application/json"})
    @ResponseStatus(value = HttpStatus.OK)
    public TaskNode getTaskNodeById(@PathVariable UUID organizationId,
                                    @PathVariable UUID projectId,
                                    @RequestParam UUID id) {
        return taskNodeService.getTaskNodeById(id);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @GetMapping(value = "/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}/task-nodes", produces = {"application/json"})
    @ResponseStatus(value = HttpStatus.OK)
    public Page<TaskNode> getTaskNodesByTaskId(@PathVariable UUID organizationId,
                                               @PathVariable UUID projectId,
                                               @PathVariable UUID taskId,
                                               Pageable pageable) {

        return taskNodeService.getTaskNodesByTaskId(taskId, pageable);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @PostMapping(value = "/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}/task-nodes/search", produces = {"application/json"})
    @ResponseStatus(value = HttpStatus.OK)
    public Page<TaskNode> getTaskNodesByCriteria(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @RequestBody TaskNodeCriteria criteria,
            Pageable pageable) {
        return taskNodeService.getTaskNodesByCriteria(criteria, pageable);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @PostMapping(value = "/organizations/{organizationId}/projects/{projectId}/task-edges")
    @ResponseStatus(value = HttpStatus.CREATED)
    public TaskEdge createTaskEdge(@PathVariable UUID organizationId,
                                   @PathVariable UUID projectId,
                                   @RequestBody TaskEdgeDTO taskEdgeDTO) throws GendoxException {
        TaskEdge taskEdge = taskEdgeConverter.toEntity(taskEdgeDTO);
        return taskEdgeService.createTaskEdge(taskEdge);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @GetMapping(value = "/organizations/{organizationId}/projects/{projectId}/task-edges", produces = {"application/json"})
    @ResponseStatus(value = HttpStatus.OK)
    public TaskEdge getTaskEdgeById(@PathVariable UUID organizationId,
                                    @PathVariable UUID projectId,
                                    @RequestParam UUID id) {
        return taskEdgeService.getTaskEdgeById(id);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @PostMapping(value = "/organizations/{organizationId}/projects/{projectId}/task-edges/search", produces = {"application/json"})
    @ResponseStatus(value = HttpStatus.OK)
    public Page<TaskEdge> getTaskEdgesByCriteria(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @RequestBody TaskEdgeCriteria criteria,
            Pageable pageable) {
        return taskEdgeService.getTaskEdgesByCriteria(criteria, pageable);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @DeleteMapping(value = "/organizations/{organizationId}/projects/{projectId}/task-nodes/{taskNodeId}")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    public void deleteTaskNodeAndConnectionNodes(@PathVariable UUID organizationId,
                                                 @PathVariable UUID projectId,
                                                 @PathVariable UUID taskNodeId) throws GendoxException {
        taskNodeService.deleteTaskNodeAndConnectionNodes(taskNodeId);
        logger.info("Request to delete task node and connected nodes: taskNodeId={}", taskNodeId);

    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @DeleteMapping(value = "/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    public void deleteTask(@PathVariable UUID organizationId,
                           @PathVariable UUID projectId,
                           @PathVariable UUID taskId) throws GendoxException {
        taskService.deleteTask(taskId);
        logger.info("Request to delete task: taskId={}", taskId);
    }

    @GetMapping(value = "/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}/export-csv")
    public ResponseEntity<InputStreamResource> exportTaskCsv(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId
    ) throws GendoxException {
        InputStreamResource fileResource = taskCsvExportService.exportTaskCsv(taskId);
        String filename = "task_" + taskId + "_answers.csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(fileResource);
    }


}
