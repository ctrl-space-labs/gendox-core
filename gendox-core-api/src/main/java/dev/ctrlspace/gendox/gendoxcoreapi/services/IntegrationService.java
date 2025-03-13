package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.IntegrationConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationWebSite;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.IntegrationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.WebsiteIntegrationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.IntegrationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.IntegrationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.IntegrationPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.IntegrationTypesConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
    Logger logger = LoggerFactory.getLogger(IntegrationService.class);
    private IntegrationRepository integrationRepository;
    private IntegrationConverter integrationConverter;
    private TypeService typeService;
    private SubscriptionValidationService subscriptionValidationService;


    @Autowired
    public IntegrationService(IntegrationRepository integrationRepository,
                              IntegrationConverter integrationConverter,
                              TypeService typeService,
                              SubscriptionValidationService subscriptionValidationService) {
        this.integrationRepository = integrationRepository;
        this.integrationConverter = integrationConverter;
        this.typeService = typeService;
        this.subscriptionValidationService = subscriptionValidationService;
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


    public Integration createIntegration(IntegrationDTO integrationDTO) throws GendoxException {

        Integration integration = integrationConverter.toEntity(integrationDTO);
        integration = integrationRepository.save(integration);

        return integration;

    }

    public Integration updateIntegration(Integration integration) throws GendoxException {

        return integrationRepository.save(integration);
    }

    public void deleteIntegration(UUID id) throws Exception {
        Integration integration = integrationRepository.findById(id).orElse(null);
        if (integration != null) {
            integrationRepository.deleteById(id);
        } else {
            throw new GendoxException("INTEGRATION_NOT_FOUND", "Organization not found with id: " + id, HttpStatus.NOT_FOUND);
        }


    }

    public Integration handleIntegrationLogic(UUID organizationId, OrganizationWebSite organizationWebSite, WebsiteIntegrationDTO websiteIntegrationDTO) throws GendoxException {
        UUID integrationId = organizationWebSite.getIntegrationId();
        boolean isActiveStatus = "ACTIVE".equals(websiteIntegrationDTO.getIntegrationStatus().getName());

        if (integrationId == null) {
            logger.debug("No existing integration found, creating a new one.");
            return createNewIntegration(organizationId, websiteIntegrationDTO);
        }

        Integration integration = getIntegrationById(integrationId);
        // check if organization has reached max integrations and if the integration is not active and the new status is active
        if (!integration.getActive() && isActiveStatus && !subscriptionValidationService.canCreateIntegrations(organizationId)) {
            throw new GendoxException("MAX_INTEGRATIONS_REACHED", "Max integrations reached for organization", HttpStatus.BAD_REQUEST);
        }
        return updateExistingIntegration(integration, websiteIntegrationDTO);

    }

    public Integration createNewIntegration(UUID organizationId, WebsiteIntegrationDTO websiteIntegrationDTO) throws GendoxException {
        boolean isActiveStatus = "ACTIVE".equals(websiteIntegrationDTO.getIntegrationStatus().getName());

        // check if organization has reached max integrations and if the integration is active
        if (isActiveStatus && !subscriptionValidationService.canCreateIntegrations(organizationId)) {
            throw new GendoxException("MAX_INTEGRATIONS_REACHED", "Max integrations reached for organization", HttpStatus.BAD_REQUEST);
        }

        logger.info("Creating new integration for Organization ID: {}, Domain: {}", organizationId, websiteIntegrationDTO.getDomain());
        boolean activeState = isActiveStatus(websiteIntegrationDTO.getIntegrationStatus().getName());
        IntegrationDTO newIntegrationDTO = IntegrationDTO
                .builder()
                .organizationId(organizationId)
                .active(activeState)
                .url(websiteIntegrationDTO.getContextPath())
                .integrationType(typeService.getIntegrationTypeByName(IntegrationTypesConstants.API_INTEGRATION))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return createIntegration(newIntegrationDTO);
    }

    public Integration updateExistingIntegration(Integration integration, WebsiteIntegrationDTO websiteIntegrationDTO) throws GendoxException {
        logger.info("Updating existing integration ID: {}", integration.getId());
        String statusName = websiteIntegrationDTO.getIntegrationStatus().getName();
        boolean newActiveState = isActiveStatus(statusName);

        integration.setUrl(websiteIntegrationDTO.getContextPath());
        integration.setActive(newActiveState);
        return updateIntegration(integration);

    }

    private boolean isActiveStatus(String statusName) {
        return "ACTIVE".equals(statusName);
    }


}

