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
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;


@RestController
public class TaskController {
    Logger logger = LoggerFactory.getLogger(TaskController.class);
    private final TaskService taskService;
    private final TaskNodeConverter taskNodeConverter;
    private final TaskEdgeConverter taskEdgeConverter;


    @Autowired
    public TaskController(TaskService taskService,
                          TaskNodeConverter taskNodeConverter,
                          TaskEdgeConverter taskEdgeConverter) {
        this.taskService = taskService;
        this.taskNodeConverter = taskNodeConverter;
        this.taskEdgeConverter = taskEdgeConverter;
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
    @PostMapping(value = "/organizations/{organizationId}/projects/{projectId}/task-nodes")
    @ResponseStatus(value = HttpStatus.CREATED)
    public TaskNode createTaskNode(@PathVariable UUID organizationId,
                                   @PathVariable UUID projectId,
                                   @RequestBody TaskNodeDTO taskNodeDTO) throws GendoxException {
        TaskNode taskNode = taskNodeConverter.toEntity(taskNodeDTO);
        return taskService.createTaskNode(taskNode);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @PutMapping(value = "/organizations/{organizationId}/projects/{projectId}/task-nodes")
    @ResponseStatus(value = HttpStatus.OK)
    public TaskNode updateTaskNode(@PathVariable UUID organizationId,
                                   @PathVariable UUID projectId,
                                   @RequestBody TaskNodeDTO taskNodeDTO) throws GendoxException {
        TaskNode taskNode = taskNodeConverter.toEntity(taskNodeDTO);
        return taskService.updateTaskNode(taskNode);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @GetMapping(value = "/organizations/{organizationId}/projects/{projectId}/task-nodes", produces = {"application/json"})
    @ResponseStatus(value = HttpStatus.OK)
    public TaskNode getTaskNodeById(@PathVariable UUID organizationId,
                                    @PathVariable UUID projectId,
                                    @RequestParam UUID id) {
        return taskService.getTaskNodeById(id);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @GetMapping(value = "/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}/task-nodes", produces = {"application/json"})
    @ResponseStatus(value = HttpStatus.OK)
    public Page<TaskNode> getTaskNodesByTaskId(@PathVariable UUID organizationId,
                                               @PathVariable UUID projectId,
                                               @PathVariable UUID taskId,
                                               Pageable pageable) {

        return taskService.getTaskNodesByTaskId(taskId, pageable);
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
        return taskService.getTaskNodesByCriteria(criteria, pageable);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @PostMapping(value = "/organizations/{organizationId}/projects/{projectId}/task-edges")
    @ResponseStatus(value = HttpStatus.CREATED)
    public TaskEdge createTaskEdge(@PathVariable UUID organizationId,
                                   @PathVariable UUID projectId,
                                   @RequestBody TaskEdgeDTO taskEdgeDTO) throws GendoxException {
        TaskEdge taskEdge = taskEdgeConverter.toEntity(taskEdgeDTO);
        return taskService.createTaskEdge(taskEdge);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @GetMapping(value = "/organizations/{organizationId}/projects/{projectId}/task-edges", produces = {"application/json"})
    @ResponseStatus(value = HttpStatus.OK)
    public TaskEdge getTaskEdgeById(@PathVariable UUID organizationId,
                                    @PathVariable UUID projectId,
                                    @RequestParam UUID id) {
        return taskService.getTaskEdgeById(id);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @PostMapping(value = "/organizations/{organizationId}/projects/{projectId}/task-edges/search", produces = {"application/json"})
    @ResponseStatus(value = HttpStatus.OK)
    public Page<TaskEdge> getTaskEdgesByCriteria(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @RequestBody TaskEdgeCriteria criteria,
            Pageable pageable) {
        return taskService.getTaskEdgesByCriteria(criteria, pageable);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @DeleteMapping(value = "/organizations/{organizationId}/projects/{projectId}/task-nodes/{taskNodeId}")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    public void deleteTaskNodeAndConnectionNodes(@PathVariable UUID organizationId,
                                                 @PathVariable UUID projectId,
                                                 @PathVariable UUID taskNodeId) throws GendoxException {
        taskService.deleteTaskNodeAndConnectionNodes(taskNodeId);
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


}
