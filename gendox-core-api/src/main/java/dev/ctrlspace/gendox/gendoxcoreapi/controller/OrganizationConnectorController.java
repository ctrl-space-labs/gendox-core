package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.OrganizationConnectorConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationConnector;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.OrganizationConnectorDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationConnectorService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import io.micrometer.observation.annotation.Observed;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
public class OrganizationConnectorController {

    private final OrganizationConnectorService organizationConnectorService;
    private final OrganizationConnectorConverter organizationConnectorConverter;

    @Autowired
    public OrganizationConnectorController(OrganizationConnectorService organizationConnectorService,
                                           OrganizationConnectorConverter organizationConnectorConverter) {
        this.organizationConnectorService = organizationConnectorService;
        this.organizationConnectorConverter = organizationConnectorConverter;
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
    public List<OrganizationConnectorDTO> getConnectors(@PathVariable UUID organizationId) throws GendoxException {
        List<OrganizationConnector> entities = organizationConnectorService.getAllByOrganizationId(organizationId);
        List<OrganizationConnectorDTO> dtos = new java.util.ArrayList<>(entities.size());
        for (OrganizationConnector entity : entities) {
            dtos.add(organizationConnectorConverter.toDTO(entity));
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
                                                 @PathVariable String connectorType) throws GendoxException {
        OrganizationConnector entity = organizationConnectorService.getByOrganizationAndType(organizationId, connectorType);
        return organizationConnectorConverter.toDTO(entity);
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
