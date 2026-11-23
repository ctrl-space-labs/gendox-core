package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModelProvider;
import dev.ctrlspace.gendox.gendoxcoreapi.services.AiModelService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.CustomAiModelService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class AiModelController {

    private AiModelService aiModelService;
    private CustomAiModelService customAiModelService;
    private SecurityUtils securityUtils;

    @Autowired
    public AiModelController(AiModelService aiModelService,
                             CustomAiModelService customAiModelService,
                             SecurityUtils securityUtils) {
        this.aiModelService = aiModelService;
        this.customAiModelService = customAiModelService;
        this.securityUtils = securityUtils;
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("organizations/{organizationId}/projects/{projectId}/ai-models")
    @Operation(summary = "Get all ai-models by project ID",
            description = "Retrieve all ai-models by project ID. The user must have the appropriate permissions to access this.")
    public List<AiModel> getAllAiModels(@PathVariable UUID organizationId) throws GendoxException {

        return aiModelService.getAllActiveAiModelsByOrganizationId(organizationId);
    }
    


    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("organizations/{organizationId}/ai-models/providers")
    @Operation(summary = "Get all ai-model providers by organization ID",
            description = "Retrieve all ai-model providers by organization ID. The user must have the appropriate permissions to access this.")
    public List<AiModelProvider> getAllAiModelProviders(@PathVariable UUID organizationId) throws GendoxException {
        return aiModelService.getAllAiModelProviders(organizationId);
    }

    // ---- the organization's own providers and models, managed by whoever manages its model keys

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_MODEL_KEYS', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("organizations/{organizationId}/ai-models/providers")
    @Operation(summary = "Add a provider of the organization",
            description = "name and baseUrl, e.g. https://llm.example.com/v1. Its key is the organization's model key for it.")
    public AiModelProvider createProvider(@PathVariable UUID organizationId,
                                          @RequestBody AiModelProvider provider) throws GendoxException {
        return customAiModelService.createProvider(organizationId, provider);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_MODEL_KEYS', 'getRequestedOrgIdFromPathVariable')")
    @PutMapping("organizations/{organizationId}/ai-models/providers/{providerId}")
    @Operation(summary = "Update a provider of the organization", description = "A new base URL applies to all its models.")
    public AiModelProvider updateProvider(@PathVariable UUID organizationId,
                                          @PathVariable UUID providerId,
                                          @RequestBody AiModelProvider provider) throws GendoxException {
        return customAiModelService.updateProvider(organizationId, providerId, provider);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_MODEL_KEYS', 'getRequestedOrgIdFromPathVariable')")
    @DeleteMapping("organizations/{organizationId}/ai-models/providers/{providerId}")
    @Operation(summary = "Delete a provider of the organization", description = "Only one without models; its key is deleted too.")
    public void deleteProvider(@PathVariable UUID organizationId,
                               @PathVariable UUID providerId) throws GendoxException {
        customAiModelService.deleteProvider(organizationId, providerId);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_ORGANIZATION_MODEL_KEYS', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("organizations/{organizationId}/ai-models")
    @Operation(summary = "Get the organization's own models", description = "Active and inactive.")
    public List<AiModel> getOrganizationModels(@PathVariable UUID organizationId) {
        return customAiModelService.getModels(organizationId);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_MODEL_KEYS', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("organizations/{organizationId}/ai-models")
    @Operation(summary = "Add a model of the organization", description = "On one of the organization's providers (aiModelProvider.id).")
    public AiModel createModel(@PathVariable UUID organizationId,
                               @RequestBody AiModel model) throws GendoxException {
        return customAiModelService.createModel(organizationId, model);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_MODEL_KEYS', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("organizations/{organizationId}/ai-model-tests")
    @Operation(summary = "Test a model before it is saved",
            description = "The body is the model as it would be saved. One small request is sent to it, and the result " +
                    "is returned; the model is not saved.")
    public CustomAiModelService.ModelTestResult testModel(@PathVariable UUID organizationId,
                                                          @RequestBody AiModel model) throws GendoxException {
        return customAiModelService.testModel(organizationId, model);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_MODEL_KEYS', 'getRequestedOrgIdFromPathVariable')")
    @PutMapping("organizations/{organizationId}/ai-models/{modelId}")
    @Operation(summary = "Update a model of the organization")
    public AiModel updateModel(@PathVariable UUID organizationId,
                               @PathVariable UUID modelId,
                               @RequestBody AiModel model) throws GendoxException {
        return customAiModelService.updateModel(organizationId, modelId, model);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_MODEL_KEYS', 'getRequestedOrgIdFromPathVariable')")
    @DeleteMapping("organizations/{organizationId}/ai-models/{modelId}")
    @Operation(summary = "Delete a model of the organization", description = "A model in use cannot be deleted; deactivate it instead.")
    public void deleteModel(@PathVariable UUID organizationId,
                            @PathVariable UUID modelId) throws GendoxException {
        customAiModelService.deleteModel(organizationId, modelId);
    }
}
