package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.IntegrationConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.IntegrationActiveDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.IntegrationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.IntegrationScheduleDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.IntegrationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.IntegrationService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
public class IntegrationController {

    private IntegrationService integrationService;
    private IntegrationConverter integrationConverter;
    private ProjectService projectService;

    @Autowired
    public IntegrationController(IntegrationService integrationService,
                                 IntegrationConverter integrationConverter,
                                 ProjectService projectService) {
        this.integrationService = integrationService;
        this.integrationConverter = integrationConverter;
        this.projectService = projectService;


    }


    @GetMapping("/integrations/{id}")
    @Operation(summary = "Get integration by ID",
            description = "Retrieve integration details by its unique ID.")

    public Integration getIntegrationById(@PathVariable UUID id) throws GendoxException {
        return integrationService.getIntegrationById(id);
    }

    @GetMapping("/integrations")
    @PreAuthorize("(#criteria.organizationId == null || " +
            "@securityUtils.hasAuthority('OP_READ_ORGANIZATION_WEB_SITES', 'getRequestedOrgsFromRequestParams')) && " +
            "(#criteria.projectId == null || " +
            "@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectsFromRequestParams'))")
    @Operation(summary = "Get all integrations.",
            description = "Retrieve a list of all projects based on the provided criteria." +
                    " The project ID is a necessary criterion")

    public Page<Integration> getAllIntegrations(@Valid IntegrationCriteria criteria, Pageable pageable) throws GendoxException {

        if (pageable == null) {
            pageable = PageRequest.of(0, 100);

        }

        if (pageable.getPageSize() > 100) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 100", HttpStatus.BAD_REQUEST);
        }

        return integrationService.getAllIntegrations(criteria, pageable);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_WEB_SITES', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("/organizations/{organizationId}/integrations/trigger")
    @Operation(summary = "Trigger integrations for an organization",
            description = "Asynchronously trigger active integrations for the given organization. Returns 202 Accepted immediately.")
    public ResponseEntity<Void> triggerIntegration(@PathVariable UUID organizationId) {
        integrationService.triggerForOrganization(organizationId);
        return ResponseEntity.accepted().build();
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_WEB_SITES', 'getRequestedOrgIdFromPathVariable')")
    @PutMapping("/organizations/{organizationId}/integrations/{id}/active")
    @Operation(summary = "Turn an integration on or off",
            description = "Changes only whether the scheduler picks this integration up. Everything else about it is left alone.")
    public Integration setIntegrationActive(@PathVariable UUID organizationId,
                                            @PathVariable UUID id,
                                            @RequestBody IntegrationActiveDTO activeDTO) throws GendoxException {

        if (activeDTO.getActive() == null) {
            throw new GendoxException("ACTIVE_REQUIRED", "active is required", HttpStatus.BAD_REQUEST);
        }

        return integrationService.setActive(organizationId, id, activeDTO.getActive());
    }

    // TODO: preauthorize has OP_CREATE_INTEGRATION
    @PostMapping(value = "/integrations", consumes = {"application/json"})
    @ResponseStatus(value = HttpStatus.CREATED)
    @Operation(summary = "Create integrations",
            description = "Create a new integration based on the provided integration details.")
    public Integration createIntegration(@RequestBody IntegrationDTO integrationDTO) throws GendoxException {

        if (integrationDTO.getId() != null) {
            throw new GendoxException("INTEGRATION_ID_MUST_BE_NULL", "Integration id is not null", HttpStatus.BAD_REQUEST);

        }

        // make projects auto-training true
        if (integrationDTO.getProjectId() != null) {
            Project project = projectService.getProjectById(integrationDTO.getProjectId());
            project.setAutoTraining(true);
            projectService.updateProject(project);

            // a project belongs to exactly one organization, so the organization is
            // derived here instead of being trusted from the request body
            if (integrationDTO.getOrganizationId() == null) {
                integrationDTO.setOrganizationId(project.getOrganizationId());
            }
        }

        return integrationService.createIntegration(integrationDTO);
    }


    // TODO: preauthorize has OP_UPDATE_INTEGRATION

    @PutMapping("/integrations/{id}")
    @Operation(summary = "Update integration by ID",
            description = "Update an existing integration by specifying its unique ID and providing updated integration details.")
    public Integration updateIntegration(@PathVariable UUID id, @RequestBody IntegrationDTO integrationDTO) throws Exception {
        UUID integrationId = integrationDTO.getId();

        Integration integration = new Integration();
        integration = integrationConverter.toEntity(integrationDTO);
        integration.setId(integrationId);

        if (!id.equals((integrationDTO.getId()))) {

            throw new GendoxException("INTEGRATION_ID_MISMATCH", "ID in path and ID in body are not the same", HttpStatus.BAD_REQUEST);

        }

        integration = integrationService.updateIntegration(integration);

        return integration;


    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_WEB_SITES', 'getRequestedOrgIdFromPathVariable')")
    @PutMapping("/organizations/{organizationId}/integrations/{id}/schedule")
    @Operation(summary = "Set how often an integration runs",
            description = "The interval is replaced, not merged: a body with no interval means the "
                    + "integration runs on every pass of the poller. Switch it off to stop it "
                    + "running on its own. A floor applies to types that are billed per run.")
    public Integration updateIntegrationSchedule(@PathVariable UUID organizationId,
                                                 @PathVariable UUID id,
                                                 @RequestBody IntegrationScheduleDTO scheduleDTO) throws GendoxException {

        return integrationService.updateSchedule(organizationId, id, scheduleDTO);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_WEB_SITES', 'getRequestedOrgIdFromPathVariable')")
    @DeleteMapping("/organizations/{organizationId}/integrations/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remove an integration",
            description = "Content stops arriving and the source is forgotten. The documents it has "
                    + "already produced stay in their project, and the website row keeps its domain, "
                    + "its widget and its API key — it only stops pointing at this integration.")
    public void removeIntegration(@PathVariable UUID organizationId,
                                  @PathVariable UUID id) throws GendoxException {

        integrationService.deleteIntegration(organizationId, id);
    }

}







