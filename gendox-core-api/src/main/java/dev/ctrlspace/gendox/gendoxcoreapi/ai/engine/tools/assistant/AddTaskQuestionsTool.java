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
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.InsightConfigDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeValueDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.InsightQuestionService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskNodeService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskTypeConstants;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class AddTaskQuestionsTool extends AssistantTaskTool<AddTaskQuestionsTool.Args> {

    private static final int MAX_QUESTIONS_PER_CALL = 50;

    record Question(String text, String title) {
    }

    record Args(@JsonProperty("task_id") UUID taskId, List<Question> questions) {
    }

    private final TaskNodeService taskNodeService;
    private final TaskNodeConverter taskNodeConverter;
    private final InsightQuestionService insightQuestionService;

    public AddTaskQuestionsTool(AssistantToolSupport support, TaskNodeService taskNodeService,
                                TaskNodeConverter taskNodeConverter,
                                // lazy: InsightQuestionService needs CompletionService, which needs every tool
                                @Lazy InsightQuestionService insightQuestionService) {
        super(support, "add_task_questions", Args.class);
        this.taskNodeService = taskNodeService;
        this.taskNodeConverter = taskNodeConverter;
        this.insightQuestionService = insightQuestionService;
    }

    @Override
    protected JsonNode run(Args args, ToolExecutionContext context) throws GendoxException {
        Task task = support.loadTask(context, args.taskId());
        if (!TaskTypeConstants.DOCUMENT_INSIGHTS.equals(task.getTaskType().getName())) {
            throw new GendoxException("QUESTIONS_NEED_INSIGHTS_TASK", "Only Document Insights tasks have questions", HttpStatus.BAD_REQUEST);
        }
        List<Question> questions = AssistantToolSupport.required(args.questions(), "questions");
        if (questions.isEmpty() || questions.size() > MAX_QUESTIONS_PER_CALL) {
            throw new GendoxException("INVALID_ARGUMENT",
                    "questions must list 1 to " + MAX_QUESTIONS_PER_CALL + " questions", HttpStatus.BAD_REQUEST);
        }

        List<TaskNodeDTO> dtos = new ArrayList<>();
        for (Question question : questions) {
            dtos.add(TaskNodeDTO.builder()
                    .taskId(task.getId())
                    .nodeType(TaskNodeTypeConstants.QUESTION)
                    .nodeValue(TaskNodeValueDTO.builder()
                            .message(AssistantToolSupport.required(question.text(), "text"))
                            .questionTitle(question.title())
                            .insightConfig(InsightConfigDTO.generatedText())
                            .build())
                    .build());
        }

        // the same path as POST task-nodes/batch
        List<TaskNode> nodes = new ArrayList<>();
        for (TaskNodeDTO dto : insightQuestionService.resolveAutoQuestions(dtos)) {
            nodes.add(taskNodeConverter.toEntity(dto));
        }
        List<TaskNode> created = taskNodeService.createTaskNodesBatch(nodes);

        ObjectNode result = support.objectMapper().createObjectNode();
        ArrayNode added = result.putArray("added");
        created.forEach(node -> added.add(TaskJson.question(support.objectMapper(), node)));
        result.put("note", "New questions have no answers yet. Run the task to answer them.");
        return result;
    }
}
