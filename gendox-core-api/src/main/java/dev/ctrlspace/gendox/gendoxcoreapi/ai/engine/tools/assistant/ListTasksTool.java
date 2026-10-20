package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.assistant;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ListTasksTool extends AssistantTaskTool<ListTasksTool.Args> {

    record Args(@JsonProperty("name_contains") String nameContains, Integer page, Integer size) {
    }

    private final TaskService taskService;

    public ListTasksTool(AssistantToolSupport support, TaskService taskService) {
        super(support, "list_tasks", Args.class);
        this.taskService = taskService;
    }

    @Override
    protected JsonNode run(Args args, ToolExecutionContext context) {
        TaskCriteria criteria = new TaskCriteria();
        criteria.setProjectId(context.project().getId().toString());
        criteria.setTaskNameContains(args.nameContains());

        Page<Task> tasks = taskService.getTasks(criteria, PageRequest.of(AssistantToolSupport.page(args.page()),
                AssistantToolSupport.size(args.size()), Sort.by(Sort.Direction.DESC, "createdAt")));

        List<ObjectNode> items = tasks.getContent().stream()
                .map(task -> TaskJson.summary(support.objectMapper(), task, context))
                .toList();
        return support.pageResult(items, tasks);
    }
}
