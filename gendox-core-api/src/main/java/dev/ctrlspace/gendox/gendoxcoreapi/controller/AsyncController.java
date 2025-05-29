package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.services.AsyncService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.AsyncExecutionTypes;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.UUID;

@RestController
public class AsyncController {

    private final AsyncService asyncService;

    @Autowired
    public AsyncController(AsyncService asyncService) {
        this.asyncService = asyncService;
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectIdFromPathVariable')" +
            "&& @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("organizations/{organizationId}/projects/{projectId}/splitting/training")
    @Operation(summary = "Trigger splitter and training Spring Jobs",
            description = "Trigger splitter and training Spring Jobs.")
    public String AsyncSplittingAndTraining() throws GendoxException {
        asyncService.executeSplitterAndTraining(null, AsyncExecutionTypes.SPLITTER_AND_TRAINING);
        return "STARTED";
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectIdFromPathVariable')" +
            "&& @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("organizations/{organizationId}/projects/{projectId}/splitting/training/project")
    @Operation(summary = "Trigger project-specific splitter and training Spring Jobs",
            description = "Trigger project-specific splitter and training Spring Jobs.")
    public String AsyncSplittingAndTrainingProject(@PathVariable UUID organizationId,
                                                   @PathVariable UUID projectId) throws GendoxException {
        asyncService.executeSplitterAndTraining(projectId, AsyncExecutionTypes.SPLITTER_AND_TRAINING);
        return "STARTED";
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectIdFromPathVariable')" +
            "&& @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("organizations/{organizationId}/projects/{projectId}/splitting")
    @Operation(summary = "Trigger splitter Spring Jobs",
            description = "Trigger splitter Spring Jobs.")
    public String AsyncSplitting(@PathVariable UUID organizationId,
                                 @PathVariable UUID projectId) throws GendoxException {
        asyncService.executeSplitterAndTraining(null, AsyncExecutionTypes.SPLITTER);
        return "STARTED";
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectIdFromPathVariable')" +
            "&& @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("organizations/{organizationId}/projects/{projectId}/splitting/project")
    @Operation(summary = "Trigger project-specific splitter Spring Jobs",
            description = "Trigger project-specific splitter Spring Jobs.")
    public String AsyncSplittingProject(@PathVariable UUID organizationId,
                                        @PathVariable UUID projectId) throws GendoxException {
        asyncService.executeSplitterAndTraining(projectId, AsyncExecutionTypes.SPLITTER);
        return "STARTED";
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectIdFromPathVariable')" +
            "&& @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("organizations/{organizationId}/projects/{projectId}/training")
    @Operation(summary = "Trigger  training Spring Jobs",
            description = "Trigger training Spring Jobs.")
    public String AsyncTraining(@PathVariable UUID organizationId,
                                @PathVariable UUID projectId) throws GendoxException {
        asyncService.executeSplitterAndTraining(null, AsyncExecutionTypes.TRAINING);
        return "STARTED";
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectIdFromPathVariable')" +
            "&& @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("organizations/{organizationId}/projects/{projectId}/training/project")
    @Operation(summary = "Trigger project-specific training Spring Jobs",
            description = "Trigger project-specific training Spring Jobs.")
    public String AsyncTrainingProject(@PathVariable UUID organizationId,
                                       @PathVariable UUID projectId) throws GendoxException {
        asyncService.executeSplitterAndTraining(projectId, AsyncExecutionTypes.TRAINING);
        return "STARTED";
    }
}

