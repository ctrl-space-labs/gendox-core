package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.assistant;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskNodeService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class GetTaskTool extends AssistantTaskTool<GetTaskTool.Args> {

    record Args(@JsonProperty("task_id") UUID taskId) {
    }

    private final TaskNodeService taskNodeService;

    public GetTaskTool(AssistantToolSupport support, TaskNodeService taskNodeService) {
        super(support, "get_task", Args.class);
        this.taskNodeService = taskNodeService;
    }

    @Override
    protected JsonNode run(Args args, ToolExecutionContext context) throws GendoxException {
        Task task = support.loadTask(context, args.taskId());

        ObjectNode result = TaskJson.summary(support.objectMapper(), task, context);
        result.put("description", task.getDescription());
        result.put("task_prompt", task.getTaskPrompt());
        result.put("documents", count(task, TaskNodeTypeConstants.DOCUMENT));
        result.put("questions", count(task, TaskNodeTypeConstants.QUESTION));
        result.put("answers", count(task, TaskNodeTypeConstants.ANSWER));
        return result;
    }

    private long count(Task task, String nodeType) {
        TaskNodeCriteria criteria = TaskNodeCriteria.builder()
                .taskId(task.getId())
                .nodeTypeNames(List.of(nodeType))
                .build();
        return taskNodeService.getTaskNodesByCriteria(criteria, PageRequest.of(0, 1)).getTotalElements();
    }
}
