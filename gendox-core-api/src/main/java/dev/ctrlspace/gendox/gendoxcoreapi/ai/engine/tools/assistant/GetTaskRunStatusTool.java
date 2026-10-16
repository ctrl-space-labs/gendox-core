package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.assistant;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.services.JobService;
import dev.ctrlspace.gendox.spring.batch.model.BatchJobExecution;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Component
public class GetTaskRunStatusTool extends AssistantTaskTool<GetTaskRunStatusTool.Args> {

    private static final int RUNS = 5;

    record Args(@JsonProperty("task_id") UUID taskId) {
    }

    private final JobService jobService;

    // lazy: the job services reach CompletionService, which needs every tool
    public GetTaskRunStatusTool(AssistantToolSupport support, @Lazy JobService jobService) {
        super(support, "get_task_run_status", Args.class);
        this.jobService = jobService;
    }

    @Override
    protected JsonNode run(Args args, ToolExecutionContext context) throws GendoxException {
        Task task = support.loadTask(context, args.taskId());
        List<BatchJobExecution> runs = jobService.getLatestTaskJobs(context.project().getId(), task.getId(), RUNS);

        ObjectNode result = support.objectMapper().createObjectNode();
        result.put("task_id", task.getId().toString());
        ArrayNode items = result.putArray("runs");
        for (BatchJobExecution run : runs) {
            ObjectNode item = items.addObject();
            item.put("job_execution_id", run.getJobExecutionId());
            item.put("status", run.getStatus());
            item.put("exit_code", run.getExitCode());
            item.put("started_at", Objects.toString(run.getStartTime(), null));
            item.put("ended_at", Objects.toString(run.getEndTime(), null));
            if (run.getExitMessage() != null && !run.getExitMessage().isBlank()) {
                item.put("exit_message", AssistantToolSupport.preview(run.getExitMessage()));
            }
        }
        if (runs.isEmpty()) {
            result.put("note", "This task has not been run yet.");
        }
        return result;
    }
}
