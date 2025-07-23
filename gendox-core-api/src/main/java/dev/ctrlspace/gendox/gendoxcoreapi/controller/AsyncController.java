package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.AsyncService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.AsyncExecutionTypes;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskTypeConstants;
import io.micrometer.observation.annotation.Observed;
import io.swagger.v3.oas.annotations.Operation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.JobExecution;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@RestController
public class AsyncController {

    Logger logger = LoggerFactory.getLogger(AsyncController.class);

    private final AsyncService asyncService;
    private final SecurityUtils securityUtils;
    private final TaskService taskService;

    @Autowired
    public AsyncController(AsyncService asyncService,
                           SecurityUtils securityUtils,
                           TaskService taskService) {
        this.asyncService = asyncService;
        this.securityUtils = securityUtils;
        this.taskService = taskService;
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
                asyncService.executeSplitter(projectIdFromRequest, timePeriodDTO);
                break;
            case AsyncExecutionTypes.TRAINING:
                asyncService.executeTraining(projectIdFromRequest, timePeriodDTO);
                break;
            case AsyncExecutionTypes.SPLITTER_AND_TRAINING:
                asyncService.executeSplitterAndTraining(projectIdFromRequest, timePeriodDTO);
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

        if (TaskTypeConstants.DOCUMENT_INSIGHTS.equalsIgnoreCase(taskType)) {
            CompletableFuture<JobExecution> futureJob = asyncService
                    .executeDocumentInsightsTask(taskId, criteria);
            return futureJob
                    .thenApply(JobExecution::getId);


        } else if (TaskTypeConstants.DOCUMENT_DIGITIZATION.equalsIgnoreCase(taskType)) {
            CompletableFuture<JobExecution> futureJob = asyncService
                    .executeDocumentDigitizationTask(taskId, criteria);
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
    @GetMapping("organizations/{organizationId}/projects/{projectId}/jobs/{jobExecutionId}/status")
    @Operation(summary = "Get Job Execution Status")
    public String getJobStatus(@PathVariable UUID organizationId,
                               @PathVariable UUID projectId,
                               @PathVariable Long jobExecutionId) throws GendoxException {
        BatchStatus status = asyncService.getJobStatus(jobExecutionId);
        if (status == null) {
            throw new GendoxException("JOB_NOT_FOUND", "Job Execution with ID " + jobExecutionId + " not found", HttpStatus.NOT_FOUND);
        }
        logger.info("Job Execution ID: {}, Status: {}", jobExecutionId, status);
        return status.name(); // π.χ. "STARTED", "COMPLETED", "FAILED"
    }


}

