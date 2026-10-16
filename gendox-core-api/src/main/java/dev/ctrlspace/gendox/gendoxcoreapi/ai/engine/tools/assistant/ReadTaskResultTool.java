package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.assistant;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.CompletionAnswerSummary;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskDocumentMetadataDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeValueDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskNodeService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Reads one task result a slice at a time, so a long digitized page or answer never lands in the
 * conversation in one piece: the result carries {@code next_offset} until the text is exhausted.
 */
@Component
public class ReadTaskResultTool extends AssistantTaskTool<ReadTaskResultTool.Args> {

    record Args(@JsonProperty("task_id") UUID taskId,
                @JsonProperty("document_id") UUID documentId,
                @JsonProperty("question_id") UUID questionId,
                @JsonProperty("page_number") Integer pageNumber,
                Boolean summary,
                Integer offset,
                @JsonProperty("max_chars") Integer maxChars) {
    }

    private final TaskNodeService taskNodeService;

    public ReadTaskResultTool(AssistantToolSupport support, TaskNodeService taskNodeService) {
        super(support, "read_task_result", Args.class);
        this.taskNodeService = taskNodeService;
    }

    @Override
    protected JsonNode run(Args args, ToolExecutionContext context) throws GendoxException {
        Task task = support.loadTask(context, args.taskId());
        UUID documentId = AssistantToolSupport.required(args.documentId(), "document_id");
        TaskNode documentNode = support.requireDocumentNode(task, documentId);

        UUID questionId = args.questionId();
        Integer pageNumber = args.pageNumber();
        boolean summary = Boolean.TRUE.equals(args.summary());

        String text;
        ObjectNode about = support.objectMapper().createObjectNode();
        about.put("document_id", documentId.toString());

        if (summary) {
            TaskDocumentMetadataDTO metadata = documentNode.getNodeValue() != null ? documentNode.getNodeValue().getDocumentMetadata() : null;
            CompletionAnswerSummary insightsSummary = metadata != null ? metadata.getInsightsSummary() : null;
            if (insightsSummary == null) {
                throw new GendoxException("TASK_RESULT_NOT_FOUND", "This document has no summary yet", HttpStatus.NOT_FOUND);
            }
            text = insightsSummary.getAnswerText();
            about.put("summary", true);
            if (insightsSummary.getAnswerValue() != null) about.put("answer_value", insightsSummary.getAnswerValue());
            if (insightsSummary.getAnswerFlagEnum() != null) about.put("flag", insightsSummary.getAnswerFlagEnum().name());
        } else if (questionId != null) {
            support.requireQuestionNode(task, questionId);
            TaskNodeValueDTO value = findAnswer(TaskNodeCriteria.builder()
                    .taskId(task.getId())
                    .nodeTypeNames(List.of(TaskNodeTypeConstants.ANSWER))
                    .nodeValueNodeDocumentId(documentNode.getId())
                    .questionNodeIds(List.of(questionId))
                    .build());
            text = value.getMessage();
            about.put("question_id", questionId.toString());
            if (value.getAnswerValue() != null) about.put("answer_value", value.getAnswerValue());
            if (value.getAnswerFlagEnum() != null) about.put("flag", value.getAnswerFlagEnum().name());
        } else if (pageNumber != null) {
            TaskNodeValueDTO value = findAnswer(TaskNodeCriteria.builder()
                    .taskId(task.getId())
                    .nodeTypeNames(List.of(TaskNodeTypeConstants.ANSWER))
                    .nodeValueNodeDocumentId(documentNode.getId())
                    .pageFrom(pageNumber)
                    .pageTo(pageNumber)
                    .build());
            text = value.getMessage();
            about.put("page_number", pageNumber);
        } else {
            throw new GendoxException("MISSING_ARGUMENT",
                    "Give question_id (Document Insights), page_number (Document Digitization) or summary=true",
                    HttpStatus.BAD_REQUEST);
        }

        ObjectNode result = support.slice(text, args.offset(), args.maxChars());
        result.setAll(about);
        return result;
    }

    private TaskNodeValueDTO findAnswer(TaskNodeCriteria criteria) throws GendoxException {
        List<TaskNode> answers = taskNodeService.getTaskNodesByCriteria(criteria,
                PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();
        if (answers.isEmpty() || answers.getFirst().getNodeValue() == null) {
            throw new GendoxException("TASK_RESULT_NOT_FOUND",
                    "No result yet. The task may not have been run for it; check with list_task_answers.",
                    HttpStatus.NOT_FOUND);
        }
        return answers.getFirst().getNodeValue();
    }
}
