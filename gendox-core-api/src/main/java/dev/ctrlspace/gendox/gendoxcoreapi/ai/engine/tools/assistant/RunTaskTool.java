package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.assistant;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.JobService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskTypeConstants;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Starts a task run that only fills in missing results. It never regenerates: that deletes the
 * existing answers, so it stays a deliberate action of the user on the task page.
 */
@Component
public class RunTaskTool extends AssistantTaskTool<RunTaskTool.Args> {

    record Args(@JsonProperty("task_id") UUID taskId,
                @JsonProperty("document_ids") List<UUID> documentIds,
                @JsonProperty("question_ids") List<UUID> questionIds) {
    }

    private final JobService jobService;

    // lazy: the job services reach CompletionService, which needs every tool
    public RunTaskTool(AssistantToolSupport support, @Lazy JobService jobService) {
        super(support, "run_task", Args.class);
        this.jobService = jobService;
    }

    @Override
    protected JsonNode run(Args args, ToolExecutionContext context) throws GendoxException {
        Task task = support.loadTask(context, args.taskId());
        String type = task.getTaskType().getName();
        boolean insights = TaskTypeConstants.DOCUMENT_INSIGHTS.equals(type);
        if (!insights && !TaskTypeConstants.DOCUMENT_DIGITIZATION.equals(type)) {
            throw new GendoxException("TASK_TYPE_NOT_RUNNABLE",
                    "Only Document Insights and Document Digitization tasks can be run from the chat", HttpStatus.BAD_REQUEST);
        }
        if (jobService.isTaskRunning(context.project().getId(), task.getId())) {
            throw new GendoxException("TASK_ALREADY_RUNNING", "This task is already running. Check it with get_task_run_status.", HttpStatus.CONFLICT);
        }

        List<UUID> documentNodeIds = new ArrayList<>();
        for (UUID documentId : args.documentIds() == null ? List.<UUID>of() : args.documentIds()) {
            documentNodeIds.add(support.requireDocumentNode(task, documentId).getId());
        }
        List<UUID> questionIds = insights && args.questionIds() != null ? args.questionIds() : List.of();
        for (UUID questionId : questionIds) {
            support.requireQuestionNode(task, questionId);
        }

        TaskNodeCriteria criteria = TaskNodeCriteria.builder()
                .taskId(task.getId())
                .documentNodeIds(documentNodeIds.isEmpty() ? null : documentNodeIds)
                .questionNodeIds(questionIds.isEmpty() ? null : questionIds)
                // never regenerate from the chat: it deletes existing answers
                .reGenerateExistingAnswers(false)
                .build();

        // @Async: returns at once, the job runs in the background
        if (insights) {
            jobService.executeDocumentInsightsTask(task, criteria);
        } else {
            jobService.executeDocumentDigitizationTask(task, criteria);
        }

        ObjectNode result = support.objectMapper().createObjectNode();
        result.put("status", "STARTED");
        result.put("task_id", task.getId().toString());
        result.put("documents", documentNodeIds.isEmpty() ? "all" : String.valueOf(documentNodeIds.size()));
        if (insights) {
            result.put("questions", questionIds.isEmpty() ? "all" : String.valueOf(questionIds.size()));
        }
        result.put("note", "Only missing results are generated. Follow progress with get_task_run_status.");
        return result;
    }
}
