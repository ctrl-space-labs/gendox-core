package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.services.AiModelService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
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

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectIdFromPathVariable')")
    @GetMapping("organizations/{organizationId}/projects/{projectId}/ai-models")
    @Operation(summary = "Get all ai-models by project ID",
            description = "Retrieve all ai-models by project ID. The user must have the appropriate permissions to access this.")
    public List<AiModel> getAllAiModels(@PathVariable UUID projectId) throws GendoxException {

        return aiModelService.getAllAiModels();
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectIdFromPathVariable')")
    @GetMapping("organizations/{organizationId}/projects/{projectId}/ai-models/categories")
    @Operation(summary = "Get ai-model by category type",
            description = "Retrieve the ai-model details by its unique ID. The user must have the appropriate permissions to access this.")
    public ResponseEntity<?> getAiModels(@PathVariable UUID projectId) throws GendoxException {

        Map<String, List<AiModel>> aiModelByCategory = new HashMap<>();
        aiModelByCategory = aiModelService.getAiModels();

        return ResponseEntity.ok().body(aiModelByCategory);
    }


//    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectIdFromPathVariable')")
//    @GetMapping("organizations/{organizationId}/projects/{projectId}/ai-models/categories")
//    @Operation(summary = "Get ai-model by category type",
//            description = "Retrieve the ai-model details by its unique ID. The user must have the appropriate permissions to access this.")
//    public ResponseEntity<?> getAiModelByNames(@PathVariable UUID projectId, @RequestBody List<String> categories) throws GendoxException {
//
//        Map<String, List<AiModel>> aiModelByCategory = new HashMap<>();
//        aiModelByCategory = aiModelService.getAiModelByCategory(categories);
//
//        return ResponseEntity.ok().body(aiModelByCategory);
//    }


}
