package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.IntegrationConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationWebSite;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.IntegrationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.IntegrationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.IntegrationPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.IntegrationManager;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.IntegrationTypesConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.WebScrapeConfigConstants;
import jakarta.transaction.Transactional;
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
    private SecurityUtils securityUtils;
    private OrganizationWebSiteService organizationWebSiteService;
    private TempIntegrationFileCheckService tempIntegrationFileCheckService;

    /**
     * The shortest interval a type may be scheduled at. A floor belongs to the type, not to
     * the column: polling a repository costs nothing, crawling a site is billed per run. A
     * type that is free to poll has no floor, and one added later inherits the question
     * rather than the number.
     */
    private static final Map<String, Integer> RUN_INTERVAL_FLOOR_BY_TYPE = Map.of(
            IntegrationTypesConstants.WEB_SCRAPE_INTEGRATION, WebScrapeConfigConstants.MIN_RUN_INTERVAL_MINUTES);


    @Autowired
    public IntegrationService(IntegrationRepository integrationRepository,
                              IntegrationConverter integrationConverter,
                              TypeService typeService,
                              SubscriptionValidationService subscriptionValidationService,
                              @Lazy IntegrationManager integrationManager,
                              @Lazy @Qualifier("integrationChannel") MessageChannel integrationChannel,
                              SecurityUtils securityUtils,
                              @Lazy OrganizationWebSiteService organizationWebSiteService,
                              @Lazy TempIntegrationFileCheckService tempIntegrationFileCheckService) {
        this.integrationRepository = integrationRepository;
        this.integrationConverter = integrationConverter;
        this.typeService = typeService;
        this.subscriptionValidationService = subscriptionValidationService;
        this.integrationManager = integrationManager;
        this.integrationChannel = integrationChannel;
        this.securityUtils = securityUtils;
        this.organizationWebSiteService = organizationWebSiteService;
        this.tempIntegrationFileCheckService = tempIntegrationFileCheckService;
    }


    public Integration getIntegrationById(UUID id) throws GendoxException {
        return integrationRepository.findById(id)
                .orElseThrow(() -> new GendoxException("INTEGRATION_NOT_FOUND", "Integration not found with id: " + id, HttpStatus.NOT_FOUND));
    }

    /**
     * The organization-scoped read. The unscoped one answered for any id to anyone who
     * had it, which is a different endpoint pretending to be this one.
     */
    public Integration getIntegration(UUID organizationId, UUID id) throws GendoxException {
        return findForOrganization(organizationId, id);
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

    /**
     * The one place the interval is judged, so every path that writes it obeys the same rule.
     */
    public void validateRunInterval(Integration integration) throws GendoxException {
        Integer minutes = integration.getRunIntervalMinutes();

        // no interval is a legitimate setting on every type: it runs on every pass of the
        // poller. An integration that should not run at all is switched off instead.
        if (minutes == null) {
            return;
        }

        if (minutes < 1) {
            throw new GendoxException("INTEGRATION_INTERVAL_INVALID",
                    "The run interval must be at least one minute", HttpStatus.BAD_REQUEST);
        }

        String typeName = integration.getIntegrationType() == null
                ? null
                : integration.getIntegrationType().getName();
        Integer floor = RUN_INTERVAL_FLOOR_BY_TYPE.get(typeName);

        if (floor != null && minutes < floor && !securityUtils.isSuperAdmin()) {
            throw new GendoxException("INTEGRATION_INTERVAL_TOO_SHORT",
                    "Only a system admin can set an interval shorter than " + floor + " minutes for this integration type",
                    HttpStatus.FORBIDDEN);
        }
    }


    public Integration createIntegration(IntegrationDTO integrationDTO) throws GendoxException {

        Integration integration = integrationConverter.toEntity(integrationDTO);
        // an integration without an organization still runs on the scheduled poller, but
        // no screen lists it and no manual trigger reaches it — it exists and is invisible
        if (integration.getOrganizationId() == null) {
            throw new GendoxException("INTEGRATION_ORGANIZATION_REQUIRED",
                    "An integration must belong to an organization", HttpStatus.BAD_REQUEST);
        }

        validateRunInterval(integration);

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

    /**
     * Looks an integration up inside the organization in the path, so an id belonging to
     * another organization answers 404 instead of confirming that it exists.
     */
    private Integration findForOrganization(UUID organizationId, UUID id) throws GendoxException {
        return integrationRepository.findById(id)
                .filter(found -> organizationId.equals(found.getOrganizationId()))
                .orElseThrow(() -> new GendoxException("INTEGRATION_NOT_FOUND",
                        "Integration not found with id: " + id, HttpStatus.NOT_FOUND));
    }

    /**
     * Turns an integration on or off and touches nothing else. The integration is looked up
     * through the organization in the path, so an id belonging to another organization
     * answers 404 instead of confirming that it exists.
     */
    public Integration setActive(UUID organizationId, UUID id, boolean active) throws GendoxException {

        Integration integration = findForOrganization(organizationId, id);

        if (Boolean.TRUE.equals(integration.getActive()) == active) {
            return integration;
        }

        // switching one on is the same event as creating one that is born running, so it
        // meets the same limit — otherwise the plan is enforced only at creation
        if (active && !subscriptionValidationService.canCreateIntegrations(organizationId)) {
            throw new GendoxException("MAX_INTEGRATIONS_REACHED",
                    "Max integrations reached for organization", HttpStatus.BAD_REQUEST);
        }

        integration.setActive(active);

        return integrationRepository.save(integration);
    }

    /**
     * Sets how often an integration runs. The interval is replaced, not merged: a body with
     * no interval leaves the integration with none, which means every pass of the poller. An
     * integration that should not run on its own is switched off instead.
     */
    public Integration updateSchedule(UUID organizationId, UUID id, IntegrationScheduleDTO scheduleDTO) throws GendoxException {
        Integration integration = findForOrganization(organizationId, id);

        integration.setRunIntervalMinutes(scheduleDTO.getRunIntervalMinutes());
        validateRunInterval(integration);

        return integrationRepository.save(integration);
    }

    /**
     * Removes a source without removing what it taught the project.
     * <p>
     * Deleting an integration and deleting its documents are two different intentions, and
     * tying them together makes the cheap one as final as the expensive one: a source is
     * re-added and read again in a minute, while documents take their sections, their
     * embeddings and every answer that cited them along with them. So the documents stay,
     * for every type, whether or not this one could name them.
     */
    @Transactional(rollbackOn = Exception.class)
    public void deleteIntegration(UUID organizationId, UUID id) throws GendoxException {
        Integration integration = findForOrganization(organizationId, id);

        tempIntegrationFileCheckService.deleteTempIntegrationFileChecksByIntegrationId(id);
        organizationWebSiteService.unlinkIntegration(id);

        // web_scrape_pages goes with it on cascade; the documents those pages became do not
        integrationRepository.delete(integration);
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
     * The third filler, next to the other two: it takes what a caller can know — the name
     * of the type — and produces the IntegrationDTO that createIntegration takes. Nothing
     * here saves anything, and the return type says so.
     */
    public IntegrationDTO toIntegrationDTO(UUID organizationId, IntegrationCreateDTO createDTO) throws GendoxException {

        if (createDTO.getType() == null || createDTO.getType().isBlank()) {
            throw new GendoxException("INTEGRATION_TYPE_REQUIRED",
                    "An integration type is required", HttpStatus.BAD_REQUEST);
        }

        String typeName = createDTO.getType().trim().toUpperCase();

        if (!IntegrationTypesConstants.RUNNABLE_TYPES.contains(typeName)) {
            throw new GendoxException("INTEGRATION_TYPE_NOT_SUPPORTED",
                    "Gendox does not run integrations of type " + typeName, HttpStatus.BAD_REQUEST);
        }

        return IntegrationDTO
                .builder()
                .organizationId(organizationId)
                .projectId(createDTO.getProjectId())
                // a source someone bothered to add is meant to run; switching it off on
                // arrival is a deliberate ask, so it has to be said
                .active(createDTO.getActive() == null || createDTO.getActive())
                .url(createDTO.getUrl())
                .repoHead(createDTO.getRepoHead())
                .directoryPath(createDTO.getDirectoryPath())
                .queueName(createDTO.getQueueName())
                .runIntervalMinutes(createDTO.getRunIntervalMinutes())
                .integrationType(typeService.getIntegrationTypeByName(typeName))
                .config("{}")
                .build();
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
    public IntegrationDTO toWebScrapeIntegrationDTO(UUID organizationId, UUID projectId, String url, Integer runIntervalMinutes) throws GendoxException {

        return IntegrationDTO
                .builder()
                .organizationId(organizationId)
                .projectId(projectId)
                .url(url)
                .active(true)
                .runIntervalMinutes(runIntervalMinutes)
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

