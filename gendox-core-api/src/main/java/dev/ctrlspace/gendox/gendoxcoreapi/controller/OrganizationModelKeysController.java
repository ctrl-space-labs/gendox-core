package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationModelProviderKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationModelKeyCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationModelKeyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
public class OrganizationModelKeysController {

    private OrganizationModelKeyService organizationModelKeyService;

    @Autowired
    public OrganizationModelKeysController(OrganizationModelKeyService organizationModelKeyService) {
        this.organizationModelKeyService = organizationModelKeyService;
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_ORGANIZATION_MODEL_KEYS', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("/organizations/{organizationId}/model-keys")
    public Page<OrganizationModelProviderKey> getAllByCriteria(@PathVariable UUID organizationId) {

        return organizationModelKeyService.getAllByCriteriaWithHiddenKeys(OrganizationModelKeyCriteria
                .builder()
                .organizationId(organizationId)
                .build());
    }
    
    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_ORGANIZATION_MODEL_KEYS', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("/organizations/{organizationId}/model-keys/{modelKeyId}")
    public OrganizationModelProviderKey getById(@PathVariable UUID organizationId,
                                                @PathVariable UUID modelKeyId) throws GendoxException {

        return organizationModelKeyService.getByIdAndOrganizationId(modelKeyId, organizationId);
    }



    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_MODEL_KEYS', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("/organizations/{organizationId}/model-keys")
    public OrganizationModelProviderKey createModelKey(@PathVariable UUID organizationId,
                                                       @RequestBody OrganizationModelProviderKey organizationModelProviderKey) throws GendoxException {

        organizationModelProviderKey.setOrganizationId(organizationId);

        return organizationModelKeyService.createModelKey(organizationModelProviderKey);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_MODEL_KEYS', 'getRequestedOrgIdFromPathVariable')")
    @PutMapping("/organizations/{organizationId}/model-keys/{modelKeyId}")
    public OrganizationModelProviderKey updateModelKey(@PathVariable UUID organizationId,
                                                       @PathVariable UUID modelKeyId,
                                                       @RequestBody OrganizationModelProviderKey organizationModelProviderKey) throws GendoxException {

        organizationModelProviderKey.setId(modelKeyId);
        organizationModelProviderKey.setOrganizationId(organizationId);

        return organizationModelKeyService.updateModelKey(organizationModelProviderKey);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_MODEL_KEYS', 'getRequestedOrgIdFromPathVariable')")
    @DeleteMapping("/organizations/{organizationId}/model-keys/{modelKeyId}")
    public void deleteModelKey(@PathVariable UUID organizationId,
                               @PathVariable UUID modelKeyId) throws GendoxException {

        organizationModelKeyService.deleteModelKey(organizationId, modelKeyId);
    }

}
