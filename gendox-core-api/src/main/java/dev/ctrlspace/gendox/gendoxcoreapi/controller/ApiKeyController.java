package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.ApiKeyConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ApiKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ApiKeyDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ApiKeyService;
import io.swagger.annotations.Api;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class ApiKeyController {

    private ApiKeyService apiKeyService;


    @Autowired
    public ApiKeyController(ApiKeyService apiKeyService) {
        this.apiKeyService = apiKeyService;

    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_API_KEYS', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("/organizations/{organizationId}/api-keys")
    public List<ApiKey> getAllByOrganizationId(@PathVariable UUID organizationId) {
        return apiKeyService.getAllByOrganizationId(organizationId);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_API_KEYS', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("/organizations/{organizationId}/api-keys")
    public ApiKey createApiKey(@PathVariable UUID organizationId, @RequestBody ApiKeyDTO apiKeyDTO) {
        return apiKeyService.createApiKey(apiKeyDTO);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_API_KEYS', 'getRequestedOrgIdFromPathVariable')")
    @PutMapping("/organizations/{organizationId}/api-keys/{apiKeyId}")
    public ApiKey updateApiKey(@PathVariable UUID organizationId,
                               @PathVariable UUID apiKeyId,
                               @RequestBody ApiKeyDTO apiKeyDTO) throws GendoxException {

        return apiKeyService.updateApiKey(apiKeyId, apiKeyDTO);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_API_KEYS', 'getRequestedOrgIdFromPathVariable')")
    @DeleteMapping("/organizations/{organizationId}/api-keys/{apiKeyId}")
    public void deleteApiKey(@PathVariable UUID organizationId, @PathVariable UUID apiKeyId) throws GendoxException {
        apiKeyService.deleteApiKey(apiKeyId);
    }

}
