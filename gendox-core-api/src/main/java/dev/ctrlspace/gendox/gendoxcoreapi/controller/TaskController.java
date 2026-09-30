package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.TaskEdgeConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.TaskNodeConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskEdge;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskDuplicateDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskEdgeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskCriteria;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;

import java.nio.charset.StandardCharsets;
import java.util.*;


@RestController
public class TaskController {
    Logger logger = LoggerFactory.getLogger(TaskController.class);
    private final TaskService taskService;
    private final TaskNodeConverter taskNodeConverter;
    private final TaskEdgeConverter taskEdgeConverter;
    private final TaskCsvExportService taskCsvExportService;
    private final TaskNodeService taskNodeService;
    private final TaskEdgeService taskEdgeService;
    private final InsightQuestionService insightQuestionService;
    private final SecurityUtils securityUtils;


    @Autowired
    public TaskController(TaskService taskService,
                          TaskNodeConverter taskNodeConverter,
                          TaskEdgeConverter taskEdgeConverter,
                          TaskCsvExportService taskCsvExportService,
                          TaskNodeService taskNodeService,
                          TaskEdgeService taskEdgeService,
                          InsightQuestionService insightQuestionService,
                          SecurityUtils securityUtils
    ) {
        this.taskService = taskService;
        this.taskNodeConverter = taskNodeConverter;
        this.taskEdgeConverter = taskEdgeConverter;
        this.taskCsvExportService = taskCsvExportService;
        this.taskNodeService = taskNodeService;
        this.taskEdgeService = taskEdgeService;
        this.insightQuestionService = insightQuestionService;
        this.securityUtils = securityUtils;

    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @PostMapping(value = "/organizations/{organizationId}/projects/{projectId}/tasks")
    @ResponseStatus(value = HttpStatus.CREATED)
    public Task createTask(@PathVariable UUID organizationId,
                           @PathVariable UUID projectId,
                           @RequestBody TaskDTO taskDTO) throws GendoxException {
        return taskService.createTask(projectId, taskDTO);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @PostMapping(value = "/organizations/{organizationId}/projects/{projectId}/tasks/duplicate")
    @ResponseStatus(value = HttpStatus.CREATED)
    public Task duplicateTask(@PathVariable UUID organizationId,
                              @PathVariable UUID projectId,
                              @RequestBody TaskDuplicateDTO taskDuplicateDTO) throws GendoxException {
        return taskService.duplicateTask(projectId, taskDuplicateDTO);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @GetMapping(value = "/organizations/{organizationId}/projects/{projectId}/tasks", produces = {"application/json"})
    @ResponseStatus(value = HttpStatus.OK)
    public Page<Task> getAllTasks(@PathVariable UUID organizationId,
                                  @PathVariable UUID projectId,
                                  TaskCriteria criteria,
                                  Pageable pageable) throws GendoxException {
        if (pageable == null || pageable.isUnpaged()) {
            pageable = PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "createdAt"));
        }
        if (pageable.getPageSize() > 100) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 100", HttpStatus.BAD_REQUEST);
        }
        if (pageable.getSort().isUnsorted()) {
            pageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                    Sort.by(Sort.Direction.DESC, "createdAt"));
        }

        TaskCriteria effectiveCriteria = criteria == null
                ? TaskCriteria.builder().build()
                : criteria.toBuilder().build();
        effectiveCriteria.setProjectId(projectId.toString());

        return taskService.getTasks(effectiveCriteria, pageable);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')" +
            " && @securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedTaskIdFromPathVariable')")
    @GetMapping(value = "/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}", produces = {"application/json"})
    @ResponseStatus(value = HttpStatus.OK)
    public Task getTaskById(@PathVariable UUID organizationId,
                            @PathVariable UUID projectId,
                            @PathVariable UUID taskId) throws GendoxException {

        Task task = taskService.getTaskById(taskId);
        return task;
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')" +
            " && @securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedTaskIdFromPathVariable')")
    @PutMapping(value = "/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}")
    @ResponseStatus(value = HttpStatus.OK)
    public Task updateTask(@PathVariable UUID organizationId,
                           @PathVariable UUID projectId,
                           @PathVariable UUID taskId,
                           @RequestBody TaskDTO taskDTO) throws GendoxException {
        return taskService.updateTask(taskId, taskDTO);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @PostMapping(value = "/organizations/{organizationId}/projects/{projectId}/task-nodes")
    @ResponseStatus(value = HttpStatus.CREATED)
    public TaskNode createTaskNode(@PathVariable UUID organizationId,
                                   @PathVariable UUID projectId,
                                   @RequestBody TaskNodeDTO taskNodeDTO) throws GendoxException {
        Task task = taskService.getTaskById(taskNodeDTO.getTaskId());
        if (task.getProjectId() == null || !task.getProjectId().equals(projectId)) {
            throw new GendoxException("INVALID_PROJECT", "Task does not belong to the specified project", HttpStatus.BAD_REQUEST);
        }
        taskNodeService.validateNodeDocumentsAccessible(List.of(taskNodeDTO), projectId);
        TaskNode taskNode = taskNodeConverter.toEntity(taskNodeDTO);
        return taskNodeService.createTaskNode(taskNode);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @PostMapping(value = "/organizations/{organizationId}/projects/{projectId}/task-nodes/batch")
    @ResponseStatus(value = HttpStatus.CREATED)
    public List<TaskNode> createTaskNodesBatch(@PathVariable UUID organizationId,
                                               @PathVariable UUID projectId,
                                               @RequestBody List<TaskNodeDTO> taskNodeDTOs) throws GendoxException {

        // every node's task must belong to the project, not just the first one's. Should be just 1 task though
        for (UUID taskId : taskNodeDTOs.stream().map(TaskNodeDTO::getTaskId).distinct().toList()) {
            Task task = taskService.getTaskById(taskId);
            if (task.getProjectId() == null || !task.getProjectId().equals(projectId)) {
                throw new GendoxException("INVALID_PROJECT", "Task does not belong to the specified project", HttpStatus.BAD_REQUEST);
            }
        }

        List<TaskNodeDTO> resolvedTaskNodeDTOs = insightQuestionService.resolveAutoQuestions(taskNodeDTOs);
        taskNodeService.validateNodeDocumentsAccessible(resolvedTaskNodeDTOs, projectId);

        try {
            List<TaskNode> nodes = new ArrayList<>();
            for (TaskNodeDTO dto : resolvedTaskNodeDTOs) {
                TaskNode node = taskNodeConverter.toEntity(dto);
                nodes.add(node);
            }
            return taskNodeService.createTaskNodesBatch(nodes);
        } catch (GendoxException exception) {
            throw exception;
        } catch (Exception e) {
            logger.error("Error creating task nodes batch: {}", e.getMessage(), e);
            throw new GendoxException("BATCH_CREATION_FAILED", "Failed to create task nodes batch", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')" +
            " && @securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedTaskIdFromPathVariable')")
    @PutMapping(value = "/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}/task-nodes")
    @ResponseStatus(value = HttpStatus.OK)
    public TaskNode updateTaskNode(@PathVariable UUID organizationId,
                                   @PathVariable UUID projectId,
                                   @PathVariable UUID taskId,
                                   @RequestBody TaskNodeDTO taskNodeDTO) throws GendoxException {
        Task task = taskService.getTaskById(taskNodeDTO.getTaskId());
        if (!task.getId().equals(taskId)) {
            throw new GendoxException("TASK_ID_MISMATCH", "Task ID in path and body do not match", HttpStatus.BAD_REQUEST);
        }
        if (!taskId.equals(taskNodeDTO.getTaskId())) {
            throw new GendoxException("INVALID_CRITERIA_SCOPE", "taskId must be the one in the path", HttpStatus.FORBIDDEN);
        }
        taskNodeService.validateNodeDocumentsAccessible(List.of(taskNodeDTO), projectId);
        return taskNodeService.updateTaskNode(taskNodeDTO, task);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')" +
            " && @securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedTaskNodeIdFromRequestParam')")
    @GetMapping(value = "/organizations/{organizationId}/projects/{projectId}/task-nodes", produces = {"application/json"})
    @ResponseStatus(value = HttpStatus.OK)
    public TaskNode getTaskNodeById(@PathVariable UUID organizationId,
                                    @PathVariable UUID projectId,
                                    @RequestParam UUID id) {
        return taskNodeService.getTaskNodeById(id);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')" +
            " && @securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedTaskIdFromPathVariable')")
    @GetMapping(value = "/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}/task-nodes", produces = {"application/json"})
    @ResponseStatus(value = HttpStatus.OK)
    public Page<TaskNode> getTaskNodesByTaskId(@PathVariable UUID organizationId,
                                               @PathVariable UUID projectId,
                                               @PathVariable UUID taskId,
                                               Pageable pageable) throws GendoxException {

        return taskNodeService.getTaskNodesByTaskId(taskId, pageable);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')" +
            " && @securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedTaskIdFromPathVariable')")
    @GetMapping(value = "/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}/document-pages", produces = {"application/json"})
    @ResponseStatus(value = HttpStatus.OK)
    public Page<DocumentNodeAnswerPagesDTO> getDocumentNodeAnswerPages(@PathVariable UUID organizationId,
                                                                       @PathVariable UUID projectId,
                                                                       @PathVariable UUID taskId,
                                                                       Pageable pageable) throws GendoxException {
        return taskNodeService.getDocumentNodeAnswerPages(taskId, pageable);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')" +
            " && @securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedTaskIdFromPathVariable')")
    @PostMapping(value = "/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}/task-nodes/search", produces = {"application/json"})
    @ResponseStatus(value = HttpStatus.OK)
    public Page<TaskNode> getTaskNodesByCriteria(@PathVariable UUID organizationId,
                                                 @PathVariable UUID projectId,
                                                 @PathVariable UUID taskId,
                                                 @RequestBody TaskNodeCriteria criteria,
                                                 Pageable pageable) throws GendoxException {

        Task task = taskService.getTaskById(taskId);

        if (!taskId.equals(criteria.getTaskId())) {
            throw new GendoxException("INVALID_CRITERIA_SCOPE", "taskId must be the one in the path", HttpStatus.FORBIDDEN);
        }
        return taskNodeService.getTaskNodesByCriteria(criteria, pageable);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')" +
            " && @securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedTaskIdFromPathVariable')")
    @PostMapping(value = "/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}/answers/batch", produces = {"application/json"})
    @ResponseStatus(value = HttpStatus.OK)
    public Page<TaskNode> getAnswerNodesByDocumentAndQuestion(
            @PathVariable UUID taskId,
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @RequestBody AnswerBatchDTO answerBatchDTO,
            Pageable pageable
    ) throws GendoxException {
        List<TaskNode> answers = new ArrayList<>();

        List<UUID> docs = Optional.ofNullable(answerBatchDTO.getDocumentNodeIds()).orElse(List.of());
        List<UUID> ques = Optional.ofNullable(answerBatchDTO.getQuestionNodeIds()).orElse(List.of());
        return taskNodeService.findAnswerNodesBatch(taskId, docs, ques, pageable);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @PostMapping(value = "/organizations/{organizationId}/projects/{projectId}/task-edges")
    @ResponseStatus(value = HttpStatus.CREATED)
    public TaskEdge createTaskEdge(@PathVariable UUID organizationId,
                                   @PathVariable UUID projectId,
                                   @RequestBody TaskEdgeDTO taskEdgeDTO) throws GendoxException {
        requireNodesInProject(List.of(taskEdgeDTO.getFromNodeId(), taskEdgeDTO.getToNodeId()), projectId);
        TaskEdge taskEdge = taskEdgeConverter.toEntity(taskEdgeDTO);
        return taskEdgeService.createTaskEdge(taskEdge);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @GetMapping(value = "/organizations/{organizationId}/projects/{projectId}/task-edges", produces = {"application/json"})
    @ResponseStatus(value = HttpStatus.OK)
    public TaskEdge getTaskEdgeById(@PathVariable UUID organizationId,
                                    @PathVariable UUID projectId,
                                    @RequestParam UUID id) throws GendoxException {
        TaskEdge taskEdge = taskEdgeService.getTaskEdgeById(id);
        if (taskEdge == null) {
            throw new GendoxException("TASK_EDGE_NOT_FOUND", "Task edge not found", HttpStatus.NOT_FOUND);
        }
        requireNodesInProject(List.of(taskEdge.getFromNode().getId(), taskEdge.getToNode().getId()), projectId);
        return taskEdge;
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @PostMapping(value = "/organizations/{organizationId}/projects/{projectId}/task-edges/search", produces = {"application/json"})
    @ResponseStatus(value = HttpStatus.OK)
    public Page<TaskEdge> getTaskEdgesByCriteria(@PathVariable UUID organizationId,
                                                 @PathVariable UUID projectId,
                                                 @RequestBody TaskEdgeCriteria criteria,
                                                 Pageable pageable) throws GendoxException {
        // The criteria has no task or project, so the nodes it filters on are what ties it to one
        List<UUID> nodeIds = new ArrayList<>();
        if (criteria.getFromNodeIds() != null) {
            nodeIds.addAll(criteria.getFromNodeIds());
        }
        if (criteria.getToNodeIds() != null) {
            nodeIds.addAll(criteria.getToNodeIds());
        }
        if (nodeIds.isEmpty()) {
            throw new GendoxException("INVALID_CRITERIA_SCOPE", "fromNodeIds or toNodeIds is required", HttpStatus.BAD_REQUEST);
        }
        requireNodesInProject(nodeIds, projectId);
        return taskEdgeService.getTaskEdgesByCriteria(criteria, pageable);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @DeleteMapping(value = "/organizations/{organizationId}/projects/{projectId}/task-nodes/{taskNodeId}")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    public void deleteTaskNodeAndConnectionNodes(@PathVariable UUID organizationId,
                                                 @PathVariable UUID projectId,
                                                 @PathVariable UUID taskNodeId) throws GendoxException {
        TaskNode taskNode = taskNodeService.getTaskNodeById(taskNodeId);
        if (taskNode == null) {
            throw new GendoxException("TASK_NODE_NOT_FOUND", "Task node not found", HttpStatus.NOT_FOUND);
        }
        Task task = taskService.getTaskById(taskNode.getTaskId());
        if (task.getProjectId() == null || !task.getProjectId().equals(projectId)) {
            throw new GendoxException("INVALID_PROJECT", "Task does not belong to the specified project", HttpStatus.BAD_REQUEST);
        }

        taskNodeService.deleteTaskNodeAndConnectionNodes(taskNodeId);
        logger.info("Request to delete task node and connected nodes: taskNodeId={}", taskNodeId);

    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')" +
            " && @securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedTaskIdFromPathVariable')")
    @DeleteMapping(value = "/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}/answers")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    public void deleteAnswerNodes(@PathVariable UUID organizationId,
                                  @PathVariable UUID projectId,
                                  @PathVariable UUID taskId,
                                  @RequestParam(name = "documentNodeIds", required = false) List<UUID> documentNodeIds,
                                  @RequestParam(name = "answerNodeIds", required = false) List<UUID> answerNodeIds) throws GendoxException {

        int deleted = taskNodeService.deleteAnswerNodes(taskId, documentNodeIds, answerNodeIds);
        logger.info("Request to delete answer nodes: taskId={}, documentNodeIds={}, answerNodeIds={}, deleted={}",
                taskId, documentNodeIds, answerNodeIds, deleted);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')" +
            " && @securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedTaskIdFromPathVariable')")
    @DeleteMapping(value = "/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    public void deleteTask(@PathVariable UUID organizationId,
                           @PathVariable UUID projectId,
                           @PathVariable UUID taskId) throws GendoxException {
        Task task = taskService.getTaskById(taskId);
        if (task == null) {
            throw new GendoxException("TASK_NOT_FOUND", "Task not found", HttpStatus.NOT_FOUND);
        }
        taskService.deleteTask(taskId);
        logger.info("Request to delete task: taskId={}", taskId);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')" +
            " && @securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedTaskIdFromPathVariable')")
    @GetMapping(value = "/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}/documents/{documentNodeId}/insights/export-csv")
    public ResponseEntity<InputStreamResource> documentInsightExportSingleCSV(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @PathVariable UUID documentNodeId
    ) throws GendoxException {
        Task task = taskService.getTaskById(taskId);
        if (task == null) {
            throw new GendoxException("TASK_NOT_FOUND", "Task not found", HttpStatus.NOT_FOUND);
        }
        InputStreamResource fileResource = taskCsvExportService.documentInsightExportSingleDocumentCSV(taskId, documentNodeId);
        String filename = "task_" + taskId + "_document_" + documentNodeId + ".csv";


        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(fileResource);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')" +
            " && @securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedTaskIdFromPathVariable')")
    @GetMapping("/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}/insights/export-csv")
    public ResponseEntity<InputStreamResource> documentInsightExportAll(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId
    ) throws GendoxException {

        Task task = taskService.getTaskById(taskId);
        if (task == null || !task.getProjectId().equals(projectId)) {
            throw new GendoxException("INVALID_PROJECT", "Task not found", HttpStatus.NOT_FOUND);

        }

        InputStreamResource fileResource = taskCsvExportService.documentInsightExportCSV(taskId);
        String filename = "task_" + taskId + "_answers.csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(fileResource);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')" +
            " && @securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedTaskIdFromPathVariable')")
    @GetMapping(value = "/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}/documents/{documentNodeId}/digitization/export-csv")
    public ResponseEntity<InputStreamResource> documentDigitizationExportCSV(@PathVariable UUID organizationId,
                                                                             @PathVariable UUID projectId,
                                                                             @PathVariable UUID taskId,
                                                                             @PathVariable UUID documentNodeId
    ) throws GendoxException {
        Task task = taskService.getTaskById(taskId);
        if (task == null) {
            throw new GendoxException("TASK_NOT_FOUND", "Task not found", HttpStatus.NOT_FOUND);
        }

        InputStreamResource fileResource = taskCsvExportService.documentDigitizationExportCSV(taskId, documentNodeId);
        String filename = "document_digitization_" + documentNodeId + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(fileResource);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')" +
            " && @securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedTaskIdFromPathVariable')")
    @PutMapping("/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}/questions/order")
    @ResponseStatus(HttpStatus.OK)
    public void reorderQuestionColumns(@PathVariable UUID organizationId,
                                       @PathVariable UUID projectId,
                                       @PathVariable UUID taskId,
                                       @RequestBody ReorderTaskQuestionNodesDTO dto) throws GendoxException {

        taskNodeService.reorderQuestionNodes(taskId, projectId, dto.getOrderedQuestionNodeIds());
    }

    /**
     * Task node ids that arrive in a request body can't be checked by @PreAuthorize, so they are
     * checked here, against the project of the URL. One query for all of them.
     */
    private void requireNodesInProject(Collection<UUID> taskNodeIds, UUID projectId) throws GendoxException {
        if (!securityUtils.areAllNodesInAnyProject(taskNodeIds, List.of(projectId))) {
            throw new GendoxException("TASK_NODE_NOT_IN_PROJECT", "One or more task nodes do not belong to the project", HttpStatus.FORBIDDEN);
        }
    }
}
