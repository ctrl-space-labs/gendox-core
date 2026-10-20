package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.assistant;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskTypeConstants;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class CreateTaskTool extends AssistantTaskTool<CreateTaskTool.Args> {

    private static final Set<String> CREATABLE_TYPES =
            Set.of(TaskTypeConstants.DOCUMENT_INSIGHTS, TaskTypeConstants.DOCUMENT_DIGITIZATION);

    record Args(String title, String type, String description, @JsonProperty("task_prompt") String taskPrompt) {
    }

    private final TaskService taskService;

    public CreateTaskTool(AssistantToolSupport support, TaskService taskService) {
        super(support, "create_task", Args.class);
        this.taskService = taskService;
    }

    @Override
    protected JsonNode run(Args args, ToolExecutionContext context) throws GendoxException {
        String type = AssistantToolSupport.required(args.type(), "type").toUpperCase();
        if (!CREATABLE_TYPES.contains(type)) {
            throw new GendoxException("INVALID_TASK_TYPE", "type must be DOCUMENT_INSIGHTS or DOCUMENT_DIGITIZATION", HttpStatus.BAD_REQUEST);
        }
        Task task = taskService.createTask(context.project().getId(), TaskDTO.builder()
                .projectId(context.project().getId())
                .type(type)
                .title(AssistantToolSupport.required(args.title(), "title"))
                .description(args.description())
                .taskPrompt(args.taskPrompt())
                .build());
        return TaskJson.summary(support.objectMapper(), task, context);
    }
}
