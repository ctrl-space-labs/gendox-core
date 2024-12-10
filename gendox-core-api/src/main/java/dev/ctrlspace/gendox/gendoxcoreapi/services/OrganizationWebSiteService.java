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
import dev.ctrlspace.gendox.gendoxcoreapi.utils.DocumentUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.IntegrationTypesConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.print.Doc;
import java.net.MalformedURLException;
import java.net.URL;
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
    private DocumentUtils documentUtils;

    @Autowired
    public OrganizationWebSiteService(OrganizationWebSiteRepository organizationWebSiteRepository,
                                      OrganizationWebSiteConverter organizationWebSiteConverter,
                                      OrganizationPlanService organizationPlanService,
                                      ApiKeyService apiKeyService,
                                      IntegrationService integrationService,
                                      DocumentUtils documentUtils) {
        this.organizationWebSiteRepository = organizationWebSiteRepository;
        this.organizationWebSiteConverter = organizationWebSiteConverter;
        this.organizationPlanService = organizationPlanService;
        this.apiKeyService = apiKeyService;
        this.integrationService = integrationService;
        this.documentUtils = documentUtils;
    }

    public OrganizationWebSite getById(UUID id) {
        return organizationWebSiteRepository.findById(id).orElse(null);
    }

    public List<OrganizationWebSite> getAllByOrganizationId(UUID organizationId) {
        return organizationWebSiteRepository.findAllByOrganizationId(organizationId);
    }

    public OrganizationWebSite getOrganizationWebSite(UUID organizationId, String domain) throws GendoxException {
        String baseDomain = documentUtils.extractBaseDomain(domain);
        return organizationWebSiteRepository.findMatchingOrganizationWebSite(organizationId, baseDomain).orElse(null);
    }

    public void integrateOrganizationWebSite(UUID organizationId, WebsiteIntegrationDTO websiteIntegrationDTO) throws GendoxException {
        logger.info("Integrating OrganizationWebSite for Organization ID: {}, WebsiteIntegrationDTO: {}", organizationId, websiteIntegrationDTO);
        // Validate API Key
        ApiKey apiKey = validateApiKey(organizationId, websiteIntegrationDTO.getApiKey().getApiKey());

        // Fetch or Create Organization WebSite
        OrganizationWebSite organizationWebSite = getOrCreateOrganizationWebSite(organizationId, websiteIntegrationDTO, apiKey);

        // Handle Integration Logic and Update Organization WebSite
        Integration integration = integrationService.handleIntegrationLogic(organizationId, organizationWebSite, websiteIntegrationDTO);
        updateOrganizationWebSite(organizationWebSite, apiKey, integration);
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
        logger.info("Creating OrganizationWebSite for Organization ID: {}", organizationId);

        if (getAllByOrganizationId(organizationId).size() >= calculateMaxWebSites(organizationId)) {
            throw new IllegalStateException("Maximum number of websites reached for this organization");
        }

        OrganizationWebSite organizationWebSite = organizationWebSiteConverter.toEntity(organizationWebSiteDTO);
        return organizationWebSiteRepository.save(organizationWebSite);
    }

    private int calculateMaxWebSites(UUID organizationId) {
        return organizationPlanService.getAllOrganizationPlansByOrganizationId(organizationId).stream()
                .mapToInt(plan -> plan.getSubscriptionPlan().getOrganizationWebSites() * plan.getNumberOfSeats())
                .sum();
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

    public void updateOrganizationWebSite(OrganizationWebSite organizationWebSite, ApiKey apiKey, Integration integration) {
        logger.info("Updating OrganizationWebSite ID: {}", organizationWebSite.getId());
        if (!apiKey.getId().equals(organizationWebSite.getApiKeyId()) ||
                !integration.getId().equals(organizationWebSite.getIntegrationId())) {

            organizationWebSite.setApiKeyId(apiKey.getId());
            organizationWebSite.setIntegrationId(integration.getId());
            organizationWebSiteRepository.save(organizationWebSite);
        }
    }

    public void deleteOrganizationWebSite(UUID id) {
        organizationWebSiteRepository.deleteById(id);
    }






}
