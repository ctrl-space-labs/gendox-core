package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.assistant;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QTaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeValueDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.TaskNodePredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskNodeService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskTypeConstants;
import org.springframework.data.domain.Page;
import org.springframework.data.querydsl.QPageRequest;
import org.springframework.data.querydsl.QSort;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class ListTaskAnswersTool extends AssistantTaskTool<ListTaskAnswersTool.Args> {

    record Args(@JsonProperty("task_id") UUID taskId,
                @JsonProperty("document_id") UUID documentId,
                @JsonProperty("question_id") UUID questionId,
                @JsonProperty("page_from") Integer pageFrom,
                @JsonProperty("page_to") Integer pageTo,
                Integer page,
                Integer size) {
    }

    private final TaskNodeService taskNodeService;

    public ListTaskAnswersTool(AssistantToolSupport support, TaskNodeService taskNodeService) {
        super(support, "list_task_answers", Args.class);
        this.taskNodeService = taskNodeService;
    }

    @Override
    protected JsonNode run(Args args, ToolExecutionContext context) throws GendoxException {
        Task task = support.loadTask(context, args.taskId());
        boolean digitization = TaskTypeConstants.DOCUMENT_DIGITIZATION.equals(task.getTaskType().getName());

        TaskNodeCriteria.TaskNodeCriteriaBuilder criteria = TaskNodeCriteria.builder()
                .taskId(task.getId())
                .nodeTypeNames(List.of(TaskNodeTypeConstants.ANSWER));

        if (args.documentId() != null) {
            criteria.nodeValueNodeDocumentId(support.requireDocumentNode(task, args.documentId()).getId());
        }
        if (args.questionId() != null) {
            support.requireQuestionNode(task, args.questionId());
            criteria.questionNodeIds(List.of(args.questionId()));
        }
        if (digitization) {
            criteria.pageFrom(args.pageFrom());
            criteria.pageTo(args.pageTo());
        }

        // digitization: page by page; insights: in the order the answers were written
        QSort sort = new QSort(
                new OrderSpecifier<>(Order.ASC, TaskNodePredicates.nodeOrder(), OrderSpecifier.NullHandling.NullsLast),
                QTaskNode.taskNode.createdAt.asc(),
                QTaskNode.taskNode.id.asc());
        Page<TaskNode> answers = taskNodeService.getTaskNodesByCriteria(criteria.build(),
                QPageRequest.of(AssistantToolSupport.page(args.page()), AssistantToolSupport.size(args.size()), sort));

        Map<UUID, UUID> documentIdByNode = support.documentIdsByNodeId(answers.getContent().stream()
                .map(node -> node.getNodeValue() != null ? node.getNodeValue().getNodeDocumentId() : null)
                .filter(Objects::nonNull)
                .toList());
        Map<UUID, String> titles = support.documentTitles(documentIdByNode.values());

        List<ObjectNode> items = answers.getContent().stream()
                .map(node -> {
                    TaskNodeValueDTO value = node.getNodeValue() != null ? node.getNodeValue() : new TaskNodeValueDTO();
                    UUID answerDocumentId = node.getDocumentId() != null ? node.getDocumentId()
                            : documentIdByNode.get(value.getNodeDocumentId());
                    ObjectNode item = support.objectMapper().createObjectNode();
                    item.put("document_id", answerDocumentId != null ? answerDocumentId.toString() : null);
                    item.put("document_title", titles.get(answerDocumentId));
                    if (digitization) {
                        item.put("page_number", value.getOrder());
                    } else {
                        item.put("question_id", value.getNodeQuestionId() != null ? value.getNodeQuestionId().toString() : null);
                        if (value.getAnswerValue() != null) item.put("answer_value", value.getAnswerValue());
                        if (value.getAnswerFlagEnum() != null) item.put("flag", value.getAnswerFlagEnum().name());
                    }
                    item.put("total_chars", AssistantToolSupport.length(value.getMessage()));
                    item.put("preview", AssistantToolSupport.preview(value.getMessage()));
                    return item;
                })
                .toList();
        return support.pageResult(items, answers);
    }
}
