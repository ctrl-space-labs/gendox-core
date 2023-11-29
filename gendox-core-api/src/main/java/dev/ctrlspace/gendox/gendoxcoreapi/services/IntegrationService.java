package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.IntegrationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.IntegrationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.IntegrationPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class IntegrationService {
    private IntegrationRepository integrationRepository;
    private SecurityUtils securityUtils;

    @Autowired
    public IntegrationService(IntegrationRepository integrationRepository,
                              SecurityUtils securityUtils){
        this.integrationRepository = integrationRepository;
        this.securityUtils = securityUtils;
    }


    public Integration getIntegrationById(UUID id) throws GendoxException {
        return integrationRepository.findById(id)
                .orElseThrow(() -> new GendoxException("INTEGRATION_NOT_FOUND", "Integration not found with id: " + id, HttpStatus.NOT_FOUND));
    }

    public Page<Integration> getAllIntegrations(IntegrationCriteria criteria) throws GendoxException {
        return this.getAllIntegrations(criteria, PageRequest.of(0, 100));
    }

    public Page<Integration> getAllIntegrations(IntegrationCriteria criteria, Pageable pageable) throws GendoxException {
        if (pageable == null) {
            throw new GendoxException("Pageable cannot be null", "pageable.null", HttpStatus.BAD_REQUEST);
        }
        return integrationRepository.findAll(IntegrationPredicates.build(criteria), pageable);
    }


    public Integration createIntegration(Integration integration) throws Exception {
        Instant now = Instant.now();

        integration.setCreatedAt(now);
        integration.setUpdatedAt(now);
        integration.setCreatedBy(securityUtils.getUserId());
        integration.setUpdatedBy(securityUtils.getUserId());

        integration = integrationRepository.save(integration);

        return integration;

    }

    public Integration updateIntegration(Integration integration) throws GendoxException {

        integration.setUpdatedAt(Instant.now());
        integration.setUpdatedBy(securityUtils.getUserId());
        integration = integrationRepository.save(integration);

        return integration;

    }

    public void deleteIntegration(UUID id) throws Exception {
        Integration integration = integrationRepository.findById(id).orElse(null);
        if (integration != null) {
            integrationRepository.deleteById(id);
        } else {
            throw new GendoxException("INTEGRATION_NOT_FOUND", "Organization not found with id: " + id, HttpStatus.NOT_FOUND);
        }


    }

}

