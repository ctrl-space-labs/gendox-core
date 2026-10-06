package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.IntegrationConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationWebSite;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.IntegratedFileDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.IntegrationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectIntegrationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.WebsiteIntegrationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.IntegrationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.IntegrationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.IntegrationPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.IntegrationManager;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.IntegrationTypesConstants;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class IntegrationService {
    Logger logger = LoggerFactory.getLogger(IntegrationService.class);
    private IntegrationRepository integrationRepository;
    private IntegrationConverter integrationConverter;
    private TypeService typeService;
    private SubscriptionValidationService subscriptionValidationService;
    private IntegrationManager integrationManager;
    private MessageChannel integrationChannel;


    @Autowired
    public IntegrationService(IntegrationRepository integrationRepository,
                              IntegrationConverter integrationConverter,
                              TypeService typeService,
                              SubscriptionValidationService subscriptionValidationService,
                              @Lazy IntegrationManager integrationManager,
                              @Lazy @Qualifier("integrationChannel") MessageChannel integrationChannel) {
        this.integrationRepository = integrationRepository;
        this.integrationConverter = integrationConverter;
        this.typeService = typeService;
        this.subscriptionValidationService = subscriptionValidationService;
        this.integrationManager = integrationManager;
        this.integrationChannel = integrationChannel;
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
        // an integration without an organization still runs on the scheduled poller, but
        // no screen lists it and no manual trigger reaches it — it exists and is invisible
        if (integration.getOrganizationId() == null) {
            throw new GendoxException("INTEGRATION_ORGANIZATION_REQUIRED",
                    "An integration must belong to an organization", HttpStatus.BAD_REQUEST);
        }

        // one rule for every type: an integration that is born running counts against the plan.
        // An inactive one does not, so a site can register itself while switched off.
        if (Boolean.TRUE.equals(integration.getActive())
                && !subscriptionValidationService.canCreateIntegrations(integration.getOrganizationId())) {
            throw new GendoxException("MAX_INTEGRATIONS_REACHED",
                    "Max integrations reached for organization", HttpStatus.BAD_REQUEST);
        }

        return integrationRepository.save(integration);

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
            return createIntegration(toApiIntegrationDTO(organizationId, websiteIntegrationDTO));
        }

        Integration integration = getIntegrationById(integrationId);
        // check if organization has reached max integrations and if the integration is not active and the new status is active
        if (!integration.getActive() && isActiveStatus && !subscriptionValidationService.canCreateIntegrations(organizationId)) {
            throw new GendoxException("MAX_INTEGRATIONS_REACHED", "Max integrations reached for organization", HttpStatus.BAD_REQUEST);
        }
        return updateExistingIntegration(integration, websiteIntegrationDTO);

    }


    /**
     * The details of an integration for a website that pushes its own content in, which today
     * means the WordPress plugin. It carries no project: the site assigns each piece of content
     * to a project of its own, so there is no single one to record here.
     */
    public IntegrationDTO toApiIntegrationDTO(UUID organizationId, WebsiteIntegrationDTO websiteIntegrationDTO) throws GendoxException {

        return IntegrationDTO
                .builder()
                .organizationId(organizationId)
                .active(isActiveStatus(websiteIntegrationDTO.getIntegrationStatus().getName()))
                .url(websiteIntegrationDTO.getContextPath())
                .integrationType(typeService.getIntegrationTypeByName(IntegrationTypesConstants.API_INTEGRATION))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }


    /**
     * The details of a web scrape source. The config starts empty and is filled by the schedule
     * update, so provider validation lives in one place only.
     */
    public IntegrationDTO toWebScrapeIntegrationDTO(UUID organizationId, UUID projectId, String url) throws GendoxException {

        return IntegrationDTO
                .builder()
                .organizationId(organizationId)
                .projectId(projectId)
                .url(url)
                .active(true)
                .integrationType(typeService.getIntegrationTypeByName(IntegrationTypesConstants.WEB_SCRAPE_INTEGRATION))
                .config("{}")
                .build();
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

    @Async
    @SchedulerLock(name = "apiIntegrationManualTrigger-#{#organizationId}", lockAtMostFor = "PT10M", lockAtLeastFor = "PT5S")
    public void triggerForOrganization(UUID organizationId) {
        try {
            logger.info("Manually triggering integrations for organization: {}", organizationId);
            Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> map =
                    integrationManager.dispatchToIntegrationServices(organizationId);
            if (map != null && !map.isEmpty()) {
                integrationChannel.send(MessageBuilder.withPayload(map).build());
                logger.info("Integration trigger dispatched for organization: {}", organizationId);
            } else {
                logger.info("No integration updates found for organization: {}", organizationId);
            }
        } catch (Exception e) {
            logger.error("Error triggering integrations for organization: {}", organizationId, e);
        }
    }


}

