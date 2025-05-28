package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.services.AsyncService;
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
    public String startAsyncProcess() throws GendoxException {
        asyncService.executeSplitterAndTraining();
        return "STARTED";
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectIdFromPathVariable')" +
            "&& @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("organizations/{organizationId}/projects/{projectId}/tasks/{taskId}/execute")
    @Operation(summary = "Execute a Task asynchronously")
    public void executeTask(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId) throws GendoxException {

        asyncService.executeTask(taskId);
    }
}

