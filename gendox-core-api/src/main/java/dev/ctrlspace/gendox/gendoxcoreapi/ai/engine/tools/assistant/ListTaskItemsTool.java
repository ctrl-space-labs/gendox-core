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
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TaskNodeRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskNodeService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** The documents or the questions of a task. */
@Component
public class ListTaskItemsTool extends AssistantTaskTool<ListTaskItemsTool.Args> {

    record Args(@JsonProperty("task_id") UUID taskId, String kind, Integer page, Integer size) {
    }

    private final TaskNodeService taskNodeService;
    private final TaskNodeRepository taskNodeRepository;

    public ListTaskItemsTool(AssistantToolSupport support, TaskNodeService taskNodeService, TaskNodeRepository taskNodeRepository) {
        super(support, "list_task_items", Args.class);
        this.taskNodeService = taskNodeService;
        this.taskNodeRepository = taskNodeRepository;
    }

    @Override
    protected JsonNode run(Args args, ToolExecutionContext context) throws GendoxException {
        Task task = support.loadTask(context, args.taskId());
        int page = AssistantToolSupport.page(args.page());
        int size = AssistantToolSupport.size(args.size());
        return switch (String.valueOf(args.kind())) {
            case "documents" -> documents(task, page, size);
            case "questions" -> questions(task, page, size);
            default -> throw new GendoxException("INVALID_ARGUMENT", "kind must be documents or questions", HttpStatus.BAD_REQUEST);
        };
    }

    private JsonNode documents(Task task, int page, int size) {
        TaskNodeCriteria criteria = TaskNodeCriteria.builder()
                .taskId(task.getId())
                .nodeTypeNames(List.of(TaskNodeTypeConstants.DOCUMENT))
                .build();
        // "title" is turned into a sort by document title by TaskNodeService
        Page<TaskNode> nodes = taskNodeService.getTaskNodesByCriteria(criteria, PageRequest.of(page, size, Sort.by("title")));
        Map<UUID, String> titles = support.documentTitles(nodes.getContent().stream().map(TaskNode::getDocumentId).toList());

        List<ObjectNode> items = nodes.getContent().stream()
                .map(node -> {
                    ObjectNode item = support.objectMapper().createObjectNode();
                    item.put("document_id", node.getDocumentId() != null ? node.getDocumentId().toString() : null);
                    item.put("title", titles.get(node.getDocumentId()));
                    TaskDocumentMetadataDTO metadata = node.getNodeValue() != null ? node.getNodeValue().getDocumentMetadata() : null;
                    if (metadata != null) {
                        if (metadata.getPageFrom() != null) item.put("page_from", metadata.getPageFrom());
                        if (metadata.getPageTo() != null) item.put("page_to", metadata.getPageTo());
                        if (metadata.getAllPages() != null) item.put("all_pages", metadata.getAllPages());
                        if (metadata.getPrompt() != null) item.put("prompt_preview", AssistantToolSupport.preview(metadata.getPrompt()));
                        if (metadata.getInsightsSummary() != null) item.put("has_summary", true);
                    }
                    return item;
                })
                .toList();
        return support.pageResult(items, nodes);
    }

    private JsonNode questions(Task task, int page, int size) {
        // a task has tens of questions, not thousands: sort by column order in memory
        List<TaskNode> questions = taskNodeRepository.findAllByTaskIdAndNodeTypeName(task.getId(), TaskNodeTypeConstants.QUESTION)
                .stream()
                .sorted(Comparator.comparing(TaskJson::order, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
        int from = Math.min(page * size, questions.size());
        int to = Math.min(from + size, questions.size());
        List<ObjectNode> items = questions.subList(from, to).stream()
                .map(node -> TaskJson.question(support.objectMapper(), node))
                .toList();
        return support.pageResult(items, page, size, questions.size());
    }
}
