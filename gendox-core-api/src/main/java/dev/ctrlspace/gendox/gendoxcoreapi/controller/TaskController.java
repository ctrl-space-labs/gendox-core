package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentOnlyConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.TaskEdgeConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.TaskNodeConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskEdge;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskEdgeDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskEdgeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeValueDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;
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
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;


@RestController
public class TaskController {
    Logger logger = LoggerFactory.getLogger(TaskController.class);
    private final TaskService taskService;
    private final TaskNodeConverter taskNodeConverter;
    private final TaskEdgeConverter taskEdgeConverter;
    private final DocumentService documentService;
    private final DocumentOnlyConverter documentOnlyConverter;


    @Autowired
    public TaskController(TaskService taskService,
                          TaskNodeConverter taskNodeConverter,
                          TaskEdgeConverter taskEdgeConverter,
                          DocumentService documentService,
                          DocumentOnlyConverter documentOnlyConverter) {
        this.taskService = taskService;
        this.taskNodeConverter = taskNodeConverter;
        this.taskEdgeConverter = taskEdgeConverter;
        this.documentService = documentService;
        this.documentOnlyConverter = documentOnlyConverter;
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

    @GetMapping(value = "/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}/export-csv")
    public ResponseEntity<InputStreamResource> exportTaskCsv(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId
    ) throws GendoxException {
        //  Validate task exists
        Page<TaskNode> documentNodes = taskService.getTaskNodesByType(taskId, TaskNodeTypeConstants.DOCUMENT);
        Page<TaskNode> questionNodes = taskService.getTaskNodesByType(taskId, TaskNodeTypeConstants.QUESTION);
        Page<TaskNode> answerNodes = taskService.getTaskNodesByType(taskId, TaskNodeTypeConstants.ANSWER);

        logger.info(
                "Exporting task CSV: taskId={}, documents={} ({} pages), questions={} ({} pages), answers={} ({} pages)",
                taskId,
                documentNodes.getTotalElements(), documentNodes.getTotalPages(),
                questionNodes.getTotalElements(), questionNodes.getTotalPages(),
                answerNodes.getTotalElements(), answerNodes.getTotalPages()
        );

        List<UUID> documentNodeIds = documentNodes.stream()
                .map(TaskNode::getDocumentId)
                .filter(Objects::nonNull)
                .toList();

        DocumentCriteria criteria = new DocumentCriteria();
        criteria.setDocumentInstanceIds(documentNodeIds.stream().map(UUID::toString).toList());
        Page<DocumentInstanceDTO> docsPage = documentService.getAllDocuments(criteria, Pageable.unpaged())
                .map(documentOnlyConverter::toDTO);
        List<DocumentInstanceDTO> documentDTOs = docsPage.getContent();

        Map<UUID, String> docIdToTitle = documentDTOs.stream()
                .collect(Collectors.toMap(
                        DocumentInstanceDTO::getId,
                        DocumentInstanceDTO::getTitle
                ));

        //  Build CSV
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        OutputStreamWriter writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);


        try {
            // --- First row: Question texts (each 3 times) ---
            writer.write("Document/Question");
            for (TaskNode question : questionNodes) {
                String qTitle = question.getNodeValue() != null && question.getNodeValue().getMessage() != null
                        ? question.getNodeValue().getMessage().replaceAll("[\r\n]+", " ")
                        : question.getId().toString();
                // Each question repeats 3 times: Answer, Flag, Message
                writer.write("," + escapeCsv(qTitle));
                writer.write(","); // blank for 2nd column of group
                writer.write(","); // blank for 3rd column of group
            }
            writer.write("\n");

            // --- Second row: Sub-headers ---
            writer.write("");
            for (int i = 0; i < questionNodes.getContent().size(); i++) {
                writer.write(",Answer,Flag,Message");
            }
            writer.write("\n");

            // --- Build a Map for fast lookup: ---
            Map<String, TaskNodeValueDTO> answerMatrix = new HashMap<>();
            for (TaskNode answerNode : answerNodes) {
                TaskNodeValueDTO value = answerNode.getNodeValue();
                if (value != null && value.getNodeDocumentId() != null && value.getNodeQuestionId() != null) {
                    String key = value.getNodeDocumentId() + "|" + value.getNodeQuestionId();
                    answerMatrix.put(key, value);
                }
            }

            // --- From third row: one row per document ---
            for (TaskNode document : documentNodes) {
                String docTitle = docIdToTitle.getOrDefault(document.getDocumentId(), document.getId().toString());
                writer.write(escapeCsv(docTitle));
                writer.write(escapeCsv(docTitle));
                for (TaskNode question : questionNodes) {
                    String key = document.getId() + "|" + question.getId();
                    TaskNodeValueDTO value = answerMatrix.get(key);
                    String answerValue = value != null && value.getAnswerValue() != null ? value.getAnswerValue() : "";
                    String flagEnum = value != null && value.getAnswerFlagEnum() != null ? value.getAnswerFlagEnum().toString() : "";
                    String message = value != null && value.getMessage() != null ? value.getMessage() : "";

                    writer.write("," + escapeCsv(answerValue));
                    writer.write("," + escapeCsv(flagEnum));
                    writer.write("," + escapeCsv(message));
                }
                writer.write("\n");
            }
            writer.flush();

            // Build response
            String filename = "task_" + taskId + "_answers.csv";
            InputStreamResource fileResource = new InputStreamResource(new ByteArrayInputStream(out.toByteArray()));

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(fileResource);

        } catch (Exception e) {
            throw new RuntimeException("Failed to export CSV", e);
        }


    }

    // Simple CSV escaping for values (double quotes, commas)
    private String escapeCsv(String value) {
        if (value == null) return "";
        boolean mustQuote = value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r");
        if (mustQuote) {
            value = value.replace("\"", "\"\"");
            return "\"" + value + "\"";
        }
        return value;
    }


}
