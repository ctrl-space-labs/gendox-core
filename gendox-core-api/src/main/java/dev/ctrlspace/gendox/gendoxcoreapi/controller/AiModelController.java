package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModelProvider;
import dev.ctrlspace.gendox.gendoxcoreapi.services.AiModelService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
public class AiModelController {

    private AiModelService aiModelService;
    private SecurityUtils securityUtils;

    @Autowired
    public AiModelController(AiModelService aiModelService,
                             SecurityUtils securityUtils) {
        this.aiModelService = aiModelService;
        this.securityUtils = securityUtils;
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("organizations/{organizationId}/projects/{projectId}/ai-models")
    @Operation(summary = "Get all ai-models by project ID",
            description = "Retrieve all ai-models by project ID. The user must have the appropriate permissions to access this.")
    public List<AiModel> getAllAiModels(@PathVariable UUID organizationId) throws GendoxException {

//        TODO: Implement the logic to get all ai-models by org ID and moler tier related to subscription plan
        return aiModelService.getAllActiveAiModelsByOrganizationId(organizationId);
    }
    


    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("organizations/{organizationId}/ai-models/providers")
    @Operation(summary = "Get all ai-model providers by organization ID",
            description = "Retrieve all ai-model providers by organization ID. The user must have the appropriate permissions to access this.")
    public List<AiModelProvider> getAllAiModelProviders(@PathVariable UUID organizationId) throws GendoxException {
        return aiModelService.getAllAiModelProviders();
    }

   


}
