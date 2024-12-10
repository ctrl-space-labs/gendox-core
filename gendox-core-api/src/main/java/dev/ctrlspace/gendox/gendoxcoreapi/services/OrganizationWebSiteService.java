package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.OrganizationWebSiteConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ApiKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationWebSite;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.IntegrationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.OrganizationWebSiteDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.WebsiteIntegrationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.OrganizationWebSiteRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.IntegrationTypesConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class OrganizationWebSiteService {
    Logger logger = LoggerFactory.getLogger(OrganizationWebSiteService.class);
    private OrganizationWebSiteRepository organizationWebSiteRepository;
    private OrganizationWebSiteConverter organizationWebSiteConverter;
    private OrganizationPlanService organizationPlanService;
    private ApiKeyService apiKeyService;
    private IntegrationService integrationService;
    private TypeService typeService;

    @Autowired
    public OrganizationWebSiteService(OrganizationWebSiteRepository organizationWebSiteRepository,
                                      OrganizationWebSiteConverter organizationWebSiteConverter,
                                      OrganizationPlanService organizationPlanService,
                                      ApiKeyService apiKeyService,
                                      IntegrationService integrationService,
                                      TypeService typeService) {
        this.organizationWebSiteRepository = organizationWebSiteRepository;
        this.organizationWebSiteConverter = organizationWebSiteConverter;
        this.organizationPlanService = organizationPlanService;
        this.apiKeyService = apiKeyService;
        this.integrationService = integrationService;
        this.typeService = typeService;
    }

    public OrganizationWebSite getById(UUID id) {
        return organizationWebSiteRepository.findById(id).orElse(null);
    }

    public List<OrganizationWebSite> getAllByOrganizationId(UUID organizationId) {
        return organizationWebSiteRepository.findAllByOrganizationId(organizationId);
    }

    public OrganizationWebSite getOrganizationWebSite(UUID organizationId, String domain) throws GendoxException {
        return organizationWebSiteRepository
                .findMatchingOrganizationWebSite(organizationId, domain)
                .orElseThrow(() -> {
                    logger.error("No matching OrganizationWebSite found for Organization ID: {}, Domain: {}", organizationId, domain);
                    return new GendoxException("ORGANIZATION_WEB_SITE_NOT_FOUND", "No matching OrganizationWebSite found with the specified criteria", HttpStatus.NOT_FOUND);
                });
    }


    public void integrateOrganizationWebSite(UUID organizationId, WebsiteIntegrationDTO websiteIntegrationDTO) throws GendoxException {
        logger.info("Integrating OrganizationWebSite for Organization ID: {}, WebsiteIntegrationDTO: {}", organizationId, websiteIntegrationDTO);
        ApiKey apiKey = apiKeyService.getByApiKey(websiteIntegrationDTO.getApiKey().getApiKey());
        if (!organizationId.equals(apiKey.getOrganizationId())) {
            logger.error("Organization mismatch: API Key belongs to Organization ID: {}, but provided Organization ID is: {}", apiKey.getOrganizationId(), organizationId);
            throw new GendoxException(
                    "ORGANIZATION_MISMATCH",
                    "The API key does not belong to the specified organization",
                    HttpStatus.FORBIDDEN
            );
        }

        // TODO create website if not exists
        OrganizationWebSite organizationWebSite = getOrganizationWebSite(organizationId, websiteIntegrationDTO.getDomain());
        // TODO if not exists, create organizationWebSite
        // TODO if exists, update organizationWebSite
        Integration integration = handleIntegrationLogic(organizationId, organizationWebSite, websiteIntegrationDTO);
        updateOrganizationWebSite(organizationWebSite, apiKey, integration);
    }


    public OrganizationWebSite createOrganizationWebSite(OrganizationWebSiteDTO organizationWebSiteDTO, UUID organizationId) {
        logger.info("Creating OrganizationWebSite for Organization ID: {}", organizationId);
        OrganizationWebSite organizationWebSite = organizationWebSiteConverter.toEntity(organizationWebSiteDTO);
        List<OrganizationWebSite> organizationWebSites = this.getAllByOrganizationId(organizationId);
        // Calculate the maximum allowed websites based on the organization's plan
        int maxWebSites = organizationPlanService.getAllOrganizationPlansByOrganizationId(organizationId).stream()
                .mapToInt(plan -> plan.getSubscriptionPlan().getOrganizationWebSites() * plan.getNumberOfSeats())
                .sum();

        // Check if adding a new website exceeds the allowed limit
        if (organizationWebSites.size() >= maxWebSites) {
            throw new IllegalStateException("Maximum number of websites reached for this organization");
        }

        return organizationWebSiteRepository.save(organizationWebSite);
    }

    public OrganizationWebSite updateOrganizationWebSite(UUID id, OrganizationWebSiteDTO organizationWebSiteDTO) {
        OrganizationWebSite existingOrganizationWebSite = organizationWebSiteRepository.findById(id).orElse(null);
        if (existingOrganizationWebSite == null) {
            return null;
        }
        existingOrganizationWebSite.setUrl(organizationWebSiteDTO.getUrl());
        existingOrganizationWebSite.setName(organizationWebSiteDTO.getName());
        return organizationWebSiteRepository.save(existingOrganizationWebSite);
    }

    public void deleteOrganizationWebSite(UUID id) {
        organizationWebSiteRepository.deleteById(id);
    }

    private Integration handleIntegrationLogic(UUID organizationId, OrganizationWebSite organizationWebSite, WebsiteIntegrationDTO websiteIntegrationDTO) throws GendoxException {
        UUID integrationId = organizationWebSite.getIntegrationId();

        if (integrationId == null) {
            logger.debug("No existing integration found, creating a new one.");
            return createNewIntegration(organizationId, websiteIntegrationDTO);
        }

        Integration integration = integrationService.getIntegrationById(integrationId);
        return updateExistingIntegration(integration, websiteIntegrationDTO);

    }

    private Integration createNewIntegration(UUID organizationId, WebsiteIntegrationDTO websiteIntegrationDTO) throws GendoxException {
        logger.info("Creating new integration for Organization ID: {}, Domain: {}", organizationId, websiteIntegrationDTO.getDomain());
        boolean activeState = isActiveStatus(websiteIntegrationDTO.getIntegrationStatus().getName());
        IntegrationDTO newIntegrationDTO = IntegrationDTO
                .builder()
                .organizationId(organizationId)
                .active(activeState)
                .url(websiteIntegrationDTO.getDomain())
                .directoryPath(websiteIntegrationDTO.getContextPath())
                .integrationType(typeService.getIntegrationTypeByName(IntegrationTypesConstants.API_INTEGRATION))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return integrationService.createIntegration(newIntegrationDTO);
    }

    private Integration updateExistingIntegration(Integration integration, WebsiteIntegrationDTO websiteIntegrationDTO) throws GendoxException {
        logger.info("Updating existing integration ID: {}", integration.getId());
        String statusName = websiteIntegrationDTO.getIntegrationStatus().getName();
        boolean isActive = integration.getActive();

        boolean newActiveState = isActiveStatus(statusName);

        if (newActiveState != isActive) {
            integration.setActive(newActiveState);
            return integrationService.updateIntegration(integration);
        }

        return integration;

    }

    private boolean isActiveStatus(String statusName) {
        return "ACTIVE".equals(statusName);
    }


    public void updateOrganizationWebSite(OrganizationWebSite organizationWebSite, ApiKey apiKey, Integration integration) {
        logger.info("Updating OrganizationWebSite ID: {}", organizationWebSite.getId());
        if (!apiKey.getId().equals(organizationWebSite.getApiKeyId()) ||
                !integration.getId().equals(organizationWebSite.getIntegrationId())) {

            organizationWebSite.setApiKeyId(apiKey.getId());
            organizationWebSite.setIntegrationId(integration.getId());
            organizationWebSiteRepository.save(organizationWebSite);
        }
    }

}
