package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.OrganizationWebSiteConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ApiKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationWebSite;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.OrganizationWebSiteDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.WebsiteIntegrationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.OrganizationWebSiteRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.DocumentUtils;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class OrganizationWebSiteService {
    Logger logger = LoggerFactory.getLogger(OrganizationWebSiteService.class);
    private OrganizationWebSiteRepository organizationWebSiteRepository;
    private OrganizationWebSiteConverter organizationWebSiteConverter;
    private ApiKeyService apiKeyService;
    private IntegrationService integrationService;
    private DocumentUtils documentUtils;
    private SubscriptionValidationService subscriptionValidationService;

    @Autowired
    public OrganizationWebSiteService(OrganizationWebSiteRepository organizationWebSiteRepository,
                                      OrganizationWebSiteConverter organizationWebSiteConverter,
                                      ApiKeyService apiKeyService,
                                      IntegrationService integrationService,
                                      DocumentUtils documentUtils,
                                      SubscriptionValidationService subscriptionValidationService) {
        this.organizationWebSiteRepository = organizationWebSiteRepository;
        this.organizationWebSiteConverter = organizationWebSiteConverter;
        this.apiKeyService = apiKeyService;
        this.integrationService = integrationService;
        this.documentUtils = documentUtils;
        this.subscriptionValidationService = subscriptionValidationService;
    }

    public OrganizationWebSite getById(UUID id) {
        return organizationWebSiteRepository.findById(id).orElse(null);
    }

    public List<OrganizationWebSite> getAllByOrganizationId(UUID organizationId) {
        return organizationWebSiteRepository.findAllByOrganizationId(organizationId);
    }

    public OrganizationWebSite getByIntegrationId(UUID integrationId) {
        return organizationWebSiteRepository.findByIntegrationId(integrationId).orElse(null);
    }

    public OrganizationWebSite getOrganizationWebSite(UUID organizationId, String domain) throws GendoxException {
        String baseDomain = documentUtils.extractBaseDomain(domain);
        return organizationWebSiteRepository.findMatchingOrganizationWebSite(organizationId, baseDomain).orElse(null);
    }

    @Transactional(rollbackOn = Exception.class)
    public OrganizationWebSite integrateOrganizationWebSite(UUID organizationId, WebsiteIntegrationDTO websiteIntegrationDTO) throws GendoxException {
        logger.info("Integrating OrganizationWebSite for Organization ID: {}, WebsiteIntegrationDTO: {}", organizationId, websiteIntegrationDTO);
        // Validate API Key
        ApiKey apiKey = validateApiKey(organizationId, websiteIntegrationDTO.getApiKey().getApiKey());

        // Fetch or Create Organization WebSite
        OrganizationWebSite organizationWebSite = getOrCreateOrganizationWebSite(organizationId, websiteIntegrationDTO, apiKey);

        // Handle Integration Logic and Update Organization WebSite
        Integration integration = integrationService.handleIntegrationLogic(organizationId, organizationWebSite, websiteIntegrationDTO);
        return updateOrganizationWebSite(organizationWebSite, apiKey, integration);
    }

    private ApiKey validateApiKey(UUID organizationId, String apiKeyValue) throws GendoxException {
        ApiKey apiKey = apiKeyService.getByApiKey(apiKeyValue);
        if (!organizationId.equals(apiKey.getOrganizationId())) {
            logger.error("Organization mismatch: API Key belongs to Organization ID: {}, but provided Organization ID is: {}", apiKey.getOrganizationId(), organizationId);
            throw new GendoxException(
                    "ORGANIZATION_MISMATCH",
                    "The API key does not belong to the specified organization",
                    HttpStatus.FORBIDDEN
            );
        }
        return apiKey;
    }

    private OrganizationWebSite getOrCreateOrganizationWebSite(UUID organizationId, WebsiteIntegrationDTO websiteIntegrationDTO, ApiKey apiKey) throws GendoxException {
        OrganizationWebSite organizationWebSite = getOrganizationWebSite(organizationId, websiteIntegrationDTO.getDomain());
        if (organizationWebSite == null) {
            Integration integration = integrationService.createNewIntegration(organizationId, websiteIntegrationDTO);

            OrganizationWebSiteDTO organizationWebSiteDTO = OrganizationWebSiteDTO.builder()
                    .organizationId(organizationId)
                    .url(websiteIntegrationDTO.getDomain())
                    .name(websiteIntegrationDTO.getDomain())
                    .apiKeyId(apiKey.getId())
                    .integrationId(integration.getId())
                    .build();

            organizationWebSite = createOrganizationWebSite(organizationWebSiteDTO, organizationId);
        }
        return organizationWebSite;
    }


    public OrganizationWebSite createOrganizationWebSite(OrganizationWebSiteDTO organizationWebSiteDTO, UUID organizationId) {
        logger.info("Creating OrganizationWebSite for Organization ID: {}", organizationId);//

//        if (!subscriptionValidationService.canCreateWebsite(organizationId, getAllByOrganizationId(organizationId).size())) {
//            throw new IllegalStateException("Maximum number of websites reached for this organization");
//        }

        OrganizationWebSite organizationWebSite = organizationWebSiteConverter.toEntity(organizationWebSiteDTO);
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

    public OrganizationWebSite updateOrganizationWebSite(OrganizationWebSite organizationWebSite, ApiKey apiKey, Integration integration) {
        logger.info("Updating OrganizationWebSite ID: {}", organizationWebSite.getId());
        if (!apiKey.getId().equals(organizationWebSite.getApiKeyId()) ||
                !integration.getId().equals(organizationWebSite.getIntegrationId())) {

            organizationWebSite.setApiKeyId(apiKey.getId());
            organizationWebSite.setIntegrationId(integration.getId());
            organizationWebSite = organizationWebSiteRepository.save(organizationWebSite);
        }

        return organizationWebSite;
    }

    public void deleteOrganizationWebSite(UUID id) {
        organizationWebSiteRepository.deleteById(id);
    }


}
