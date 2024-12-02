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

    private OrganizationWebSite getOrganizationWebSite(UUID organizationId, WebsiteIntegrationDTO websiteIntegrationDTO) throws GendoxException {
        return organizationWebSiteRepository
                .findMatchingOrganizationWebSite(
                        organizationId,
                        websiteIntegrationDTO.getDomain(),
                        websiteIntegrationDTO.getApiKey().getApiKey(),
                        websiteIntegrationDTO.getIntegrationType().getName())
                .orElseThrow(() -> new GendoxException("ORGANIZATION_WEB_SITE_NOT_FOUND", "No matching OrganizationWebSite found with the specified criteria", HttpStatus.NOT_FOUND));
    }


    public void integrateOrganizationWebSite(UUID organizationId, WebsiteIntegrationDTO websiteIntegrationDTO) throws GendoxException {
        ApiKey apiKey = apiKeyService.getByApiKey(websiteIntegrationDTO.getApiKey().getApiKey());
        OrganizationWebSite organizationWebSite = getOrganizationWebSite(organizationId, websiteIntegrationDTO);
        handleIntegrationLogic(organizationId, organizationWebSite, websiteIntegrationDTO);
        updateApiKeyForOrganizationWebSite(organizationWebSite, apiKey);
    }


    public OrganizationWebSite createOrganizationWebSite(OrganizationWebSiteDTO organizationWebSiteDTO, UUID organizationId) {
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

    private void handleIntegrationLogic(UUID organizationId, OrganizationWebSite organizationWebSite, WebsiteIntegrationDTO websiteIntegrationDTO) throws GendoxException{
        Integration integration = integrationService.getIntegrationById(organizationWebSite.getIntegrationId());

        if (integration == null) {
            createNewIntegration(organizationId, websiteIntegrationDTO);
        } else {
            updateExistingIntegration(integration, websiteIntegrationDTO);
        }
    }

    private void createNewIntegration(UUID organizationId, WebsiteIntegrationDTO websiteIntegrationDTO) throws GendoxException {
        IntegrationDTO newIntegrationDTO = IntegrationDTO
                .builder()
                .organizationId(organizationId)
                .active(websiteIntegrationDTO.getIntegrationStatus().getName().equals("ACTIVE"))
                .url(websiteIntegrationDTO.getDomain() + websiteIntegrationDTO.getContextPath())
                .integrationType(typeService.getIntegrationTypeByName(websiteIntegrationDTO.getIntegrationType().getName()))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        integrationService.createIntegration(newIntegrationDTO);
    }

    private void updateExistingIntegration(Integration integration, WebsiteIntegrationDTO websiteIntegrationDTO) throws GendoxException {
        String statusName = websiteIntegrationDTO.getIntegrationStatus().getName();
        boolean isActive = integration.getActive();

        if ("ACTIVE".equals(statusName) && !isActive) {
            integration.setActive(true);
            integrationService.updateIntegration(integration);
        } else if (("DISABLED".equals(statusName) || "PAUSED".equals(statusName)) && isActive) {
            integration.setActive(false);
            integrationService.updateIntegration(integration);
        }
    }


    public void updateApiKeyForOrganizationWebSite(OrganizationWebSite organizationWebSite, ApiKey apiKey) {
        if (!apiKey.getId().equals(organizationWebSite.getApiKeyId())) {
            organizationWebSite.setApiKeyId(apiKey.getId());
            organizationWebSiteRepository.save(organizationWebSite);
        }
    }
}
