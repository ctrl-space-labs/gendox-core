package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DeepThinkingStep;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DeepThinkingStepService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.JobService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.AsyncExecutionTypes;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskTypeConstants;
import dev.ctrlspace.gendox.spring.batch.model.BatchJobExecution;
import dev.ctrlspace.gendox.spring.batch.model.criteria.BatchExecutionCriteria;
import dev.ctrlspace.gendox.spring.batch.model.criteria.BatchExecutionParamCriteria;
import dev.ctrlspace.gendox.spring.batch.utils.JobExecutionParamConstants;
import dev.ctrlspace.gendox.spring.batch.utils.JobUtils;
import io.micrometer.observation.annotation.Observed;
import io.swagger.v3.oas.annotations.Operation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.launch.JobOperator;
import org.springframework.batch.core.launch.NoSuchJobExecutionException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@RestController
public class JobController {

    private final JobUtils jobUtils;
    private final JobOperator jobOperator;
    private final DeepThinkingStepService deepThinkingStepService;
    Logger logger = LoggerFactory.getLogger(JobController.class);

    private final JobService jobService;
    private final SecurityUtils securityUtils;
    private final TaskService taskService;

    @Autowired
    public JobController(JobService jobService,
                         SecurityUtils securityUtils,
                         TaskService taskService,
                         JobUtils jobUtils,
                         JobOperator jobOperator,
                         DeepThinkingStepService deepThinkingStepService) {
        this.jobService = jobService;
        this.securityUtils = securityUtils;
        this.taskService = taskService;
        this.jobUtils = jobUtils;
        this.jobOperator = jobOperator;
        this.deepThinkingStepService = deepThinkingStepService;
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectIdFromPathVariable')" +
            "&& @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("organizations/{organizationId}/projects/{projectId}/splitting/training")
    @Operation(
            summary = "Trigger async Spring Batch job (splitter, training, or both)",
            description = "Trigger an async job: SPLITTER, TRAINING, SPLITTER_AND_TRAINING. projectId is optional."
    )
    @Observed(name = "triggerAsyncJob",
            contextualName = "Trigger Async Job",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_DEBUG,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public String triggerAsyncJob(
            @PathVariable UUID organizationId,
            @PathVariable(required = false) UUID projectId,
            @RequestParam("jobName") String jobName,
            @RequestParam(value = "projectId", required = false) UUID projectIdFromRequest,
            @RequestBody(required = false) TimePeriodDTO timePeriodDTO
    ) throws GendoxException {
        // TODO why there is a projectId and a projectIdFromRequest?? the API should be renamed to avoid confusion

        // validation, only super admin can call the API without projectID
        if (projectIdFromRequest == null && !securityUtils.isSuperAdmin()) {
            throw new GendoxException(
                    "PROJECT_ID_REQUIRED",
                    "Request param 'projectId' is required for this operation.",
                    HttpStatus.BAD_REQUEST
            );

        }

        switch (jobName.toUpperCase()) {
            case AsyncExecutionTypes.SPLITTER:
                jobService.executeSplitter(projectIdFromRequest, timePeriodDTO);
                break;
            case AsyncExecutionTypes.TRAINING:
                jobService.executeTraining(projectIdFromRequest, timePeriodDTO);
                break;
            case AsyncExecutionTypes.SPLITTER_AND_TRAINING:
                jobService.executeSplitterAndTraining(projectIdFromRequest, timePeriodDTO);
                break;
            default:
                throw new GendoxException(
                        "INVALID_JOB_NAME",
                        "Allowed values: SPLITTER, TRAINING, SPLITTER_AND_TRAINING",
                        HttpStatus.BAD_REQUEST
                );
        }
        return "STARTED";
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectIdFromPathVariable')" +
            "&& @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("organizations/{organizationId}/projects/{projectId}/tasks/{taskId}/execute")
    @Operation(summary = "Execute a Task asynchronously")
    public CompletableFuture<Long> executeTaskByType(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @RequestBody TaskNodeCriteria criteria) throws GendoxException {

        Task task = taskService.getTaskById(taskId);
        String taskType = task.getTaskType().getName();


        if (!task.getProjectId().equals(projectId)) {
            throw new GendoxException("TASK_PROJECT_MISMATCH", "Task does not belong to the specified project", HttpStatus.BAD_REQUEST);
        }

        if (TaskTypeConstants.DOCUMENT_INSIGHTS.equalsIgnoreCase(taskType)) {
            CompletableFuture<JobExecution> futureJob = jobService
                    .executeDocumentInsightsTask(task, criteria);
            return futureJob
                    .thenApply(JobExecution::getId);


        } else if (TaskTypeConstants.DOCUMENT_DIGITIZATION.equalsIgnoreCase(taskType)) {
            CompletableFuture<JobExecution> futureJob = jobService
                    .executeDocumentDigitizationTask(task, criteria);
            return futureJob
                    .thenApply(JobExecution::getId);

        } else if (TaskTypeConstants.DEEP_RESEARCH.equalsIgnoreCase(taskType)) {
            // TODO: Implement Deep Research task execution
            throw new GendoxException("NOT_IMPLEMENTED", "Deep Research task execution not implemented yet", HttpStatus.NOT_IMPLEMENTED);
        }

        throw new GendoxException("INVALID_TASK_TYPE", "Task type not supported: " + taskType, HttpStatus.BAD_REQUEST);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectIdFromPathVariable')" +
            "&& @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("organizations/{organizationId}/projects/{projectId}/jobs/{jobExecutionId}/stop")
    @Operation(summary = "Stop a running job execution",
            description = "Gracefully stops a running Spring Batch job. For chunk-based jobs, execution stops between chunks. " +
                    "For tasklet-based jobs (e.g. deep thinking), the tasklet checks the stop signal and terminates.")
    public void stopJob(@PathVariable UUID organizationId,
                        @PathVariable UUID projectId,
                        @PathVariable Long jobExecutionId) throws GendoxException {
        jobService.assertJobExecutionBelongsToProject(jobExecutionId, projectId);

        try {
            jobOperator.stop(jobExecutionId);
            logger.info("Stop requested for job execution {}", jobExecutionId);
        } catch (NoSuchJobExecutionException e) {
            throw new GendoxException("JOB_EXECUTION_NOT_FOUND",
                    "Job execution not found: " + jobExecutionId, HttpStatus.NOT_FOUND, e);
        } catch (Exception e) {
            throw new GendoxException("JOB_STOP_FAILED",
                    "Failed to stop job execution: "+jobExecutionId, HttpStatus.INTERNAL_SERVER_ERROR, e);
        }
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectIdFromPathVariable')" +
            "&& @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("organizations/{organizationId}/projects/{projectId}/jobs/{jobExecutionId}/deep-thinking-steps")
    @Operation(summary = "Get deep thinking progress steps",
            description = "Returns the progress steps for a deep thinking job execution, ordered by step order.")
    public List<DeepThinkingStep> getDeepThinkingSteps(@PathVariable UUID organizationId,
                                                        @PathVariable UUID projectId,
                                                        @PathVariable Long jobExecutionId) throws GendoxException {
        jobService.assertJobExecutionBelongsToProject(jobExecutionId, projectId);

        return deepThinkingStepService.getSteps(jobExecutionId);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectIdFromPathVariable')" +
            "&& @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("organizations/{organizationId}/projects/{projectId}/jobs")
    @Operation(summary = "Get Job Execution Status")
    public Page<BatchJobExecution> getJobsByCriteria(@PathVariable UUID projectId, BatchExecutionCriteria jobCriteria, Pageable pageable) throws GendoxException {

        if (!securityUtils.isSuperAdmin()) {
            upsertMatchAllParam(
                    jobCriteria,
                    JobExecutionParamConstants.PROJECT_ID,
                    projectId.toString()
            );
        }

        return jobUtils.getJobsByCriteria(jobCriteria, pageable);
    }

    private void upsertMatchAllParam(BatchExecutionCriteria jobCriteria, String paramName, String paramValue) {
        List<BatchExecutionParamCriteria> params = jobCriteria.getMatchAllParams();
        if (params == null) {
            params = new ArrayList<>();
            jobCriteria.setMatchAllParams(params);
        }

        var matches = params.stream()
                .filter(Objects::nonNull)
                .filter(c -> Objects.equals(paramName, c.getParamName()))
                .toList();

        if (matches.isEmpty()) {
            params.add(new BatchExecutionParamCriteria(paramName, paramValue));
            return;
        }

        // Replace value on the first match
        BatchExecutionParamCriteria kept = matches.get(0);
        kept.setParamValue(paramValue);

        // Remove any duplicate entries (keep only the first)
        params.removeIf(c ->
                c != null
                        && Objects.equals(paramName, c.getParamName())
                        && c != kept
        );
    }


}

