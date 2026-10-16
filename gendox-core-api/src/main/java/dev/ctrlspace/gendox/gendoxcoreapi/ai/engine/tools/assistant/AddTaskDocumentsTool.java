package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.assistant;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.TaskNodeConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskDocumentMetadataDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeValueDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskNodeService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class AddTaskDocumentsTool extends AssistantTaskTool<AddTaskDocumentsTool.Args> {

    private static final int MAX_DOCUMENTS_PER_CALL = 100;

    record Document(@JsonProperty("document_id") UUID documentId,
                    @JsonProperty("page_from") Integer pageFrom,
                    @JsonProperty("page_to") Integer pageTo,
                    String prompt) {
    }

    record Args(@JsonProperty("task_id") UUID taskId, List<Document> documents) {
    }

    private final TaskNodeService taskNodeService;
    private final TaskNodeConverter taskNodeConverter;

    public AddTaskDocumentsTool(AssistantToolSupport support, TaskNodeService taskNodeService, TaskNodeConverter taskNodeConverter) {
        super(support, "add_task_documents", Args.class);
        this.taskNodeService = taskNodeService;
        this.taskNodeConverter = taskNodeConverter;
    }

    @Override
    protected JsonNode run(Args args, ToolExecutionContext context) throws GendoxException {
        Task task = support.loadTask(context, args.taskId());
        List<Document> documents = AssistantToolSupport.required(args.documents(), "documents");
        if (documents.isEmpty() || documents.size() > MAX_DOCUMENTS_PER_CALL) {
            throw new GendoxException("INVALID_ARGUMENT",
                    "documents must list 1 to " + MAX_DOCUMENTS_PER_CALL + " documents", HttpStatus.BAD_REQUEST);
        }

        Map<UUID, Document> requested = new LinkedHashMap<>();
        for (Document document : documents) {
            requested.putIfAbsent(AssistantToolSupport.required(document.documentId(), "document_id"), document);
        }
        support.requireDocumentsInProject(context, requested.keySet());
        Set<UUID> alreadyInTask = support.documentNodes(task.getId(), requested.keySet()).keySet();

        List<TaskNode> nodes = new ArrayList<>();
        for (Document document : requested.values()) {
            if (alreadyInTask.contains(document.documentId())) {
                continue;
            }
            TaskNodeValueDTO.TaskNodeValueDTOBuilder value = TaskNodeValueDTO.builder();
            if (document.pageFrom() != null || document.pageTo() != null || document.prompt() != null) {
                value.documentMetadata(TaskDocumentMetadataDTO.builder()
                        .pageFrom(document.pageFrom())
                        .pageTo(document.pageTo())
                        .allPages(document.pageFrom() == null && document.pageTo() == null ? null : false)
                        .prompt(document.prompt())
                        .supportingDocumentIds(new ArrayList<>())
                        .build());
            }
            nodes.add(taskNodeConverter.toEntity(TaskNodeDTO.builder()
                    .taskId(task.getId())
                    .nodeType(TaskNodeTypeConstants.DOCUMENT)
                    .documentId(document.documentId())
                    .nodeValue(value.build())
                    .build()));
        }
        taskNodeService.createTaskNodesBatch(nodes);

        Map<UUID, String> titles = support.documentTitles(requested.keySet());
        ObjectNode result = support.objectMapper().createObjectNode();
        ArrayNode added = result.putArray("added");
        ArrayNode skipped = result.putArray("already_in_task");
        for (UUID documentId : requested.keySet()) {
            ObjectNode item = (alreadyInTask.contains(documentId) ? skipped : added).addObject();
            item.put("document_id", documentId.toString());
            item.put("title", titles.get(documentId));
        }
        return result;
    }
}
