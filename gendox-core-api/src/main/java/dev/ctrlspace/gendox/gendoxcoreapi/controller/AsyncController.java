package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.authentication.GendoxAuthenticationToken;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.AsyncService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.AsyncExecutionTypes;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import io.micrometer.observation.annotation.Observed;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.UUID;

@RestController
public class AsyncController {

    private final AsyncService asyncService;
    private final SecurityUtils securityUtils;

    @Autowired
    public AsyncController(AsyncService asyncService,
                           SecurityUtils securityUtils) {
        this.asyncService = asyncService;
        this.securityUtils = securityUtils;
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
                        org.springframework.http.HttpStatus.BAD_REQUEST
                );
        }
        return "STARTED";
    }
}

