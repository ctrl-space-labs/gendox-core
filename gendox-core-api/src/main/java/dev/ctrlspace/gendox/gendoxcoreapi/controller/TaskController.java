package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.TaskEdgeConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.TaskNodeConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskEdge;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TaskDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TaskEdgeDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TaskNodeDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class TaskController {
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
    @PostMapping(value = "/organizations/{organizationId}/projects/{projectId}/task-nodes")
    @ResponseStatus(value = HttpStatus.CREATED)
    public TaskNode createTaskNode(@PathVariable UUID organizationId,
                                   @PathVariable UUID projectId,
                                   @RequestBody TaskNodeDTO taskNodeDTO) throws GendoxException {
        TaskNode taskNode = taskNodeConverter.toEntity(taskNodeDTO);
        return taskService.createTaskNode(taskNode);
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

}
