package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.OrganizationConnectorConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationConnector;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.OrganizationConnectorDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.AccessCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationConnectorService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import io.micrometer.observation.annotation.Observed;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
public class OrganizationConnectorController {

    private final OrganizationConnectorService organizationConnectorService;
    private final OrganizationConnectorConverter organizationConnectorConverter;
    private final SecurityUtils securityUtils;

    @Autowired
    public OrganizationConnectorController(OrganizationConnectorService organizationConnectorService,
                                           OrganizationConnectorConverter organizationConnectorConverter,
                                           SecurityUtils securityUtils) {
        this.organizationConnectorService = organizationConnectorService;
        this.organizationConnectorConverter = organizationConnectorConverter;
        this.securityUtils = securityUtils;
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("/organizations/{organizationId}/connectors")
    @Operation(summary = "List all connectors for an organization")
    @Observed(name = "OrganizationConnectorController.getConnectors",
            contextualName = "OrganizationConnectorController#getConnectors",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public List<OrganizationConnectorDTO> getConnectors(@PathVariable UUID organizationId, Authentication authentication) throws GendoxException {
        boolean canReadSecrets = securityUtils.hasAuthority((UserProfile) authentication.getPrincipal(), "OP_UPDATE_ORGANIZATION",
                AccessCriteria.builder().orgIds(Set.of(organizationId.toString())).build());
        List<OrganizationConnector> entities = organizationConnectorService.getAllByOrganizationId(organizationId);
        List<OrganizationConnectorDTO> dtos = new java.util.ArrayList<>(entities.size());
        for (OrganizationConnector entity : entities) {
            OrganizationConnectorDTO dto = organizationConnectorConverter.toDTO(entity);
            if (!canReadSecrets && dto.getConfig().containsKey("apiKey")) {
                dto.getConfig().remove("apiKey");
            }
            dtos.add(dto);
        }
        return dtos;
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("/organizations/{organizationId}/connectors/{connectorType}")
    @Operation(summary = "Get a single connector by type")
    @Observed(name = "OrganizationConnectorController.getConnector",
            contextualName = "OrganizationConnectorController#getConnector",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public OrganizationConnectorDTO getConnector(@PathVariable UUID organizationId,
                                                 @PathVariable String connectorType, Authentication authentication) throws GendoxException {
        OrganizationConnector entity = organizationConnectorService.getByOrganizationAndType(organizationId, connectorType);
        OrganizationConnectorDTO dto = organizationConnectorConverter.toDTO(entity);
        if (!securityUtils.hasAuthority((UserProfile) authentication.getPrincipal(), "OP_UPDATE_ORGANIZATION",
                AccessCriteria.builder().orgIds(Set.of(organizationId.toString())).build()) && dto.getConfig().containsKey("apiKey")) {
            dto.getConfig().remove("apiKey");
        }
        return dto;
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_ORGANIZATION', 'getRequestedOrgIdFromPathVariable')")
    @PutMapping(value = "/organizations/{organizationId}/connectors/{connectorType}", consumes = {"application/json"})
    @Operation(summary = "Upsert a connector for the organization",
            description = "Creates the connector entry if missing, or updates the existing one with the provided config.")
    @Observed(name = "OrganizationConnectorController.upsertConnector",
            contextualName = "OrganizationConnectorController#upsertConnector",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public OrganizationConnectorDTO upsertConnector(@PathVariable UUID organizationId,
                                                    @PathVariable String connectorType,
                                                    @RequestBody OrganizationConnectorDTO dto) throws GendoxException {
        OrganizationConnector saved = organizationConnectorService.upsert(organizationId, connectorType, dto);
        return organizationConnectorConverter.toDTO(saved);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_ORGANIZATION', 'getRequestedOrgIdFromPathVariable')")
    @DeleteMapping("/organizations/{organizationId}/connectors/{connectorType}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a connector configuration")
    @Observed(name = "OrganizationConnectorController.deleteConnector",
            contextualName = "OrganizationConnectorController#deleteConnector",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public void deleteConnector(@PathVariable UUID organizationId,
                                @PathVariable String connectorType) throws GendoxException {
        organizationConnectorService.delete(organizationId, connectorType);
    }
}
