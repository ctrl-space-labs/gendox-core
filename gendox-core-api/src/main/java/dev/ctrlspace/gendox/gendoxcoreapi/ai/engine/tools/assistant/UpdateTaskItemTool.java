package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.assistant;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskDocumentMetadataDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeValueDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskNodeService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskTypeConstants;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

/** Changes one question (text, title) or one document (prompt, page range) of a task. */
@Component
public class UpdateTaskItemTool extends AssistantTaskTool<UpdateTaskItemTool.Args> {

    record Args(@JsonProperty("task_id") UUID taskId,
                @JsonProperty("question_id") UUID questionId,
                String text,
                String title,
                @JsonProperty("document_id") UUID documentId,
                String prompt,
                @JsonProperty("page_from") Integer pageFrom,
                @JsonProperty("page_to") Integer pageTo,
                @JsonProperty("all_pages") Boolean allPages) {
    }

    private final TaskNodeService taskNodeService;

    public UpdateTaskItemTool(AssistantToolSupport support, TaskNodeService taskNodeService) {
        super(support, "update_task_item", Args.class);
        this.taskNodeService = taskNodeService;
    }

    @Override
    protected JsonNode run(Args args, ToolExecutionContext context) throws GendoxException {
        Task task = support.loadTask(context, args.taskId());
        if ((args.questionId() == null) == (args.documentId() == null)) {
            throw new GendoxException("INVALID_ARGUMENT", "Give either question_id or document_id", HttpStatus.BAD_REQUEST);
        }
        return args.questionId() != null ? updateQuestion(task, args) : updateDocument(task, args);
    }

    private JsonNode updateQuestion(Task task, Args args) throws GendoxException {
        TaskNode question = support.requireQuestionNode(task, args.questionId());
        if (AssistantToolSupport.isBlank(args.text()) && AssistantToolSupport.isBlank(args.title())) {
            throw new GendoxException("MISSING_ARGUMENT", "Give text, title or both", HttpStatus.BAD_REQUEST);
        }
        String previousText = question.getNodeValue() != null ? question.getNodeValue().getMessage() : null;
        boolean textChanged = !AssistantToolSupport.isBlank(args.text()) && !Objects.equals(args.text(), previousText);
        long answersCleared = textChanged ? countAnswers(TaskNodeCriteria.builder().questionNodeIds(List.of(question.getId())), task) : 0;

        // documentMetadata stays null: a non-null one would replace the question's supporting documents
        TaskNode updated = taskNodeService.updateTaskNode(TaskNodeDTO.builder()
                .id(question.getId())
                .taskId(task.getId())
                .nodeType(TaskNodeTypeConstants.QUESTION)
                .nodeValue(TaskNodeValueDTO.builder()
                        .message(AssistantToolSupport.isBlank(args.text()) ? null : args.text())
                        .questionTitle(AssistantToolSupport.isBlank(args.title()) ? null : args.title())
                        .build())
                .build(), task);

        ObjectNode result = TaskJson.question(support.objectMapper(), updated);
        result.put("answers_cleared", answersCleared);
        return result;
    }

    private JsonNode updateDocument(Task task, Args args) throws GendoxException {
        TaskNode documentNode = support.requireDocumentNode(task, args.documentId());
        if (args.prompt() == null && args.pageFrom() == null && args.pageTo() == null && args.allPages() == null) {
            throw new GendoxException("MISSING_ARGUMENT", "Give prompt, page_from, page_to or all_pages", HttpStatus.BAD_REQUEST);
        }
        TaskDocumentMetadataDTO current = documentNode.getNodeValue() != null ? documentNode.getNodeValue().getDocumentMetadata() : null;
        boolean promptChanged = args.prompt() != null
                && TaskTypeConstants.DOCUMENT_INSIGHTS.equals(task.getTaskType().getName())
                && !Objects.equals(args.prompt(), current != null ? current.getPrompt() : null);
        long answersCleared = promptChanged ? countAnswers(TaskNodeCriteria.builder().nodeValueNodeDocumentId(documentNode.getId()), task) : 0;

        // supportingDocumentIds stays null, so the document's supporting documents are kept
        TaskNode updated = taskNodeService.updateTaskNode(TaskNodeDTO.builder()
                .id(documentNode.getId())
                .taskId(task.getId())
                .nodeType(TaskNodeTypeConstants.DOCUMENT)
                .nodeValue(TaskNodeValueDTO.builder()
                        .documentMetadata(TaskDocumentMetadataDTO.builder()
                                .taskNodeId(documentNode.getId())
                                .prompt(args.prompt())
                                .pageFrom(args.pageFrom())
                                .pageTo(args.pageTo())
                                .allPages(args.allPages())
                                .build())
                        .build())
                .build(), task);

        TaskDocumentMetadataDTO metadata = updated.getNodeValue() != null ? updated.getNodeValue().getDocumentMetadata() : null;
        ObjectNode result = support.objectMapper().createObjectNode();
        result.put("document_id", args.documentId().toString());
        if (metadata != null) {
            result.put("page_from", metadata.getPageFrom());
            result.put("page_to", metadata.getPageTo());
            result.put("all_pages", metadata.getAllPages());
            result.put("prompt", metadata.getPrompt());
        }
        result.put("answers_cleared", answersCleared);
        return result;
    }

    // counted before the update, which deletes them
    private long countAnswers(TaskNodeCriteria.TaskNodeCriteriaBuilder criteria, Task task) {
        return taskNodeService.getTaskNodesByCriteria(criteria
                        .taskId(task.getId())
                        .nodeTypeNames(List.of(TaskNodeTypeConstants.ANSWER))
                        .build(), PageRequest.of(0, 1))
                .getTotalElements();
    }
}
