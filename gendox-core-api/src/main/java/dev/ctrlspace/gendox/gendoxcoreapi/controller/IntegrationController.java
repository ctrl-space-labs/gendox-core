package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.IntegrationConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.IntegrationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.IntegrationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.IntegrationService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

public class IntegrationController {

    private IntegrationService integrationService;
    private JWTUtils jwtUtils;

    private IntegrationConverter integrationConverter;

    @Autowired
    public IntegrationController(IntegrationService integrationService,
                                 JWTUtils jwtUtils,
                                 IntegrationConverter integrationConverter) {

        this.integrationService = integrationService;
        this.jwtUtils = jwtUtils;
        this.integrationConverter = integrationConverter;

    }


    @GetMapping("/integrations/{id}")
    @Operation(summary = "Get integration by ID",
            description = "Retrieve integration details by its unique ID.")

    public Integration getIntegrationById(@PathVariable UUID id) throws GendoxException {
        return integrationService.getIntegrationById(id);
    }

    @GetMapping("/integrations")
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

    // TODO: preauthorize has OP_CREATE_INTEGRATION
    @PostMapping(value = "/integrations", consumes = {"application/json"})
    @ResponseStatus(value = HttpStatus.CREATED)
    @Operation(summary = "Create integrations",
            description = "Create a new integration based on the provided integration details.")
    public Integration createIntegration(@RequestBody IntegrationDTO integrationDTO) throws Exception {

        if (integrationDTO.getId() != null) {
            throw new GendoxException("INTEGRATION_ID_MUST_BE_NULL", "Integration id is not null", HttpStatus.BAD_REQUEST);

        }

        Integration integration = integrationConverter.toEntity(integrationDTO);
        integration = integrationService.createIntegration(integration);

        return integration;
    }
    // TODO: preauthorize has OP_UPDATE_INTEGRATION

    @PutMapping("/integrations/{id}")
    @Operation(summary = "Update integration by ID",
            description = "Update an existing integration by specifying its unique ID and providing updated integration details.")
    public Integration integration(@PathVariable UUID id, @RequestBody IntegrationDTO integrationDTO) throws Exception {
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

    // TODO: preauthorize has OP_DELETE_INTEGRATION
    @DeleteMapping("/integrations/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete integration by ID",
            description = "Delete an existing integration by specifying its unique ID.")
    public void deleteIntegration(@PathVariable UUID id) throws Exception {
        integrationService.deleteIntegration(id);
    }

}







