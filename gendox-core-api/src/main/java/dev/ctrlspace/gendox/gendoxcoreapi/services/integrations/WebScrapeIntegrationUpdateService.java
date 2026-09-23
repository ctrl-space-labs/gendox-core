package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.WebScrapePage;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.IntegratedFileDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectIntegrationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.WebScrapeScheduleDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape.DiscoveredPageDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape.WebCrawlResultDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape.WebPageContentDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape.WebScrapeTargetDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.IntegrationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.WebScrapePageRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.SubscriptionValidationService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.s3BucketIntegration.ResourceMultipartFile;
import dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.webScrapeIntegration.WebScrapeProvider;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.WebScrapeProviderUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.FirecrawlConfig;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.WebScrapeConfigConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.WebScrapePageStatusConstants;
import jakarta.transaction.Transactional;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Component
public class WebScrapeIntegrationUpdateService implements IntegrationUpdateService {

    Logger logger = LoggerFactory.getLogger(WebScrapeIntegrationUpdateService.class);


    private WebScrapeProviderUtils webScrapeProviderUtils;
    private WebScrapePageRepository webScrapePageRepository;
    private SubscriptionValidationService subscriptionValidationService;
    private DocumentService documentService;
    private ObjectMapper objectMapper;
    private IntegrationRepository integrationRepository;

    @Autowired
    public WebScrapeIntegrationUpdateService(WebScrapeProviderUtils webScrapeProviderUtils,
                                             WebScrapePageRepository webScrapePageRepository,
                                             SubscriptionValidationService subscriptionValidationService,
                                             DocumentService documentService,
                                             ObjectMapper objectMapper,
                                             IntegrationRepository integrationRepository) {
        this.integrationRepository = integrationRepository;
        this.webScrapeProviderUtils = webScrapeProviderUtils;
        this.webScrapePageRepository = webScrapePageRepository;
        this.subscriptionValidationService = subscriptionValidationService;
        this.documentService = documentService;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(value = Transactional.TxType.REQUIRES_NEW)
    public Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> checkForUpdates(Integration integration) throws GendoxException {

        Integer intervalMinutes = integration.getRunIntervalMinutes();
        if (intervalMinutes == null) {
            return Map.of();
        }

        Instant lastRunAt = integration.getLastRunAt();
        if (lastRunAt != null && Instant.now().isBefore(lastRunAt.plus(intervalMinutes, ChronoUnit.MINUTES))) {
            return Map.of();
        }

        if (!subscriptionValidationService.canUseWebScrape(integration.getOrganizationId())) {
            logger.info("Web scraping is not included in the plan of organization {}, skipping integration {}",
                    integration.getOrganizationId(), integration.getId());
            return Map.of();
        }

        discoverPages(integration);
        scrapeSelectedPages(integration);

        return Map.of();
    }

    /**
     * Lists the pages of the site and stores what is new, without downloading any content.
     */
    public void discoverPages(Integration integration) throws GendoxException {

        Map<String, Object> config = readConfig(integration);
        WebScrapeProvider provider = resolveProvider(config);
        WebScrapeTargetDTO target = buildTarget(integration, config);

        WebCrawlResultDTO result = provider.crawl(target);

        savePages(integration, result);
    }

    /**
     * Downloads the pages the user has selected and stores each one as a document.
     */
    public void scrapeSelectedPages(Integration integration) throws GendoxException {

        Map<String, Object> config = readConfig(integration);
        WebScrapeProvider provider = resolveProvider(config);
        WebScrapeTargetDTO target = buildTarget(integration, config);

        // pages the user unselected, whose document must go
        List<WebScrapePage> deselectedPages = webScrapePageRepository.findAllByIntegrationId(integration.getId())
                .stream()
                .filter(page -> !Boolean.TRUE.equals(page.getSelected()))
                .filter(page -> page.getDocumentInstanceId() != null)
                .toList();

        if (!deselectedPages.isEmpty()) {
            documentService.deleteAllDocumentInstances(deselectedPages.stream()
                    .map(WebScrapePage::getDocumentInstanceId)
                    .toList());

            for (WebScrapePage page : deselectedPages) {
                page.setDocumentInstanceId(null);
                page.setContentHash(null);
                page.setStatus(WebScrapePageStatusConstants.DISCOVERED);
                webScrapePageRepository.save(page);
            }
        }

        // which pages will download
        List<WebScrapePage> selectedPages = webScrapePageRepository.findAllByIntegrationId(integration.getId())
                .stream()
                .filter(page -> Boolean.TRUE.equals(page.getSelected()))
                .filter(page -> !WebScrapePageStatusConstants.REMOVED.equals(page.getStatus()))
                .sorted(Comparator.comparing(WebScrapePage::getLastScrapedAt,
                        Comparator.nullsFirst(Comparator.naturalOrder())))
                .toList();

        for (WebScrapePage page : selectedPages) {
            if (!subscriptionValidationService.canScrapeWebPages(integration.getOrganizationId(), 1)) {
                logger.info("Monthly web scraping budget reached for organization {}, deferring the remaining pages",
                        integration.getOrganizationId());
                break;
            }

            try {
                WebPageContentDTO content = provider.scrape(target, page.getUrl());
                page.setLastScrapedAt(Instant.now());

                if (!content.getContentHash().equals(page.getContentHash())) {
                    MultipartFile file = new ResourceMultipartFile(
                            new ByteArrayResource(content.getMarkdown().getBytes(StandardCharsets.UTF_8)),
                            slug(page.getUrl()) + ".md",
                            "text/markdown");

                    DocumentInstance instance = documentService.uploadSingleFile(
                            file, false, null, integration.getOrganizationId(), integration.getProjectId());

                    page.setDocumentInstanceId(instance.getId());
                    page.setContentHash(content.getContentHash());
                }

                page.setStatus(WebScrapePageStatusConstants.SCRAPED);
                page.setErrorMessage(null);

            } catch (GendoxException e) {
                boolean pageIsGone = "WEB_SCRAPE_PAGE_NOT_FOUND".equals(e.getErrorCode());

                logger.warn("Page {} of integration {} failed: {}", page.getUrl(), integration.getId(), e.getMessage());
                page.setStatus(pageIsGone
                        ? WebScrapePageStatusConstants.REMOVED
                        : WebScrapePageStatusConstants.FAILED);
                page.setErrorMessage(e.getMessage());

            } catch (IOException | NoSuchAlgorithmException e) {
                logger.warn("Could not store page {} of integration {}", page.getUrl(), integration.getId(), e);
                page.setStatus(WebScrapePageStatusConstants.FAILED);
                page.setErrorMessage(e.getMessage());
            }

            webScrapePageRepository.save(page);
        }
    }

    /**
     * Crawls the site in depth and stores what is new. Costs one credit per page visited.
     */
    public void deepDiscoverPages(Integration integration) throws GendoxException {

        Map<String, Object> config = readConfig(integration);
        WebScrapeProvider provider = resolveProvider(config);
        WebScrapeTargetDTO target = buildTarget(integration, config);

        WebCrawlResultDTO result = provider.deepCrawl(target);

        savePages(integration, result);
    }

    // ----------------------------------------------------------------
    // manual actions: the checks run in the request thread, the work does not
    // ----------------------------------------------------------------

    public void validateCrawl(UUID integrationId) throws GendoxException {
        loadAndCheckPlan(integrationId);
    }

    public void validateDeepCrawl(UUID integrationId) throws GendoxException {

        Integration integration = loadAndCheckPlan(integrationId);

        Map<String, Object> config = readConfig(integration);
        Integer crawlPageLimit = (Integer) config.get(WebScrapeConfigConstants.CRAWL_PAGE_LIMIT);

        if (crawlPageLimit == null) {
            throw new GendoxException("WEB_SCRAPE_CRAWL_LIMIT_REQUIRED",
                    "A crawl page limit is required for a deep crawl",
                    HttpStatus.BAD_REQUEST);
        }

        if (!subscriptionValidationService.canScrapeWebPages(integration.getOrganizationId(), crawlPageLimit)) {
            throw new GendoxException("MAX_WEB_SCRAPE_PAGES_REACHED",
                    "The monthly web scraping budget of organization " + integration.getOrganizationId()
                            + " is not enough for " + crawlPageLimit + " pages",
                    HttpStatus.FORBIDDEN);
        }
    }

    public void validateScrape(UUID integrationId) throws GendoxException {

        Integration integration = loadAndCheckPlan(integrationId);

        if (!subscriptionValidationService.canScrapeWebPages(integration.getOrganizationId(), 1)) {
            throw new GendoxException("MAX_WEB_SCRAPE_PAGES_REACHED",
                    "The monthly web scraping budget of organization " + integration.getOrganizationId()
                            + " has been reached",
                    HttpStatus.FORBIDDEN);
        }
    }

    @Async
    @SchedulerLock(name = "webScrapeManualTrigger-#{#integrationId}",
            lockAtMostFor = "PT30M", lockAtLeastFor = "PT5S")
    public void triggerCrawl(UUID integrationId) {
        try {
            logger.info("Manually listing the pages of web scrape integration {}", integrationId);
            discoverPages(loadIntegration(integrationId));
        } catch (Exception e) {
            logger.error("Error listing the pages of web scrape integration {}", integrationId, e);
        }
    }

    @Async
    @SchedulerLock(name = "webScrapeManualTrigger-#{#integrationId}",
            lockAtMostFor = "PT30M", lockAtLeastFor = "PT5S")
    public void triggerDeepCrawl(UUID integrationId) {
        try {
            logger.info("Manually deep crawling the site of web scrape integration {}", integrationId);
            deepDiscoverPages(loadIntegration(integrationId));
        } catch (Exception e) {
            logger.error("Error deep crawling the site of web scrape integration {}", integrationId, e);
        }
    }

    @Async
    @SchedulerLock(name = "webScrapeManualTrigger-#{#integrationId}",
            lockAtMostFor = "PT30M", lockAtLeastFor = "PT5S")
    public void triggerScrape(UUID integrationId) {
        try {
            logger.info("Manually scraping the selected pages of web scrape integration {}", integrationId);
            scrapeSelectedPages(loadIntegration(integrationId));
        } catch (Exception e) {
            logger.error("Error scraping the selected pages of web scrape integration {}", integrationId, e);
        }
    }

    /**
     * Removes a crawl source completely: the documents it produced, its page rows
     * and the integration itself.
     * <p>
     * The page rows follow the integration through their foreign key, but the
     * documents do not — they live in the project, and once the pages are gone
     * nothing is left that knows they came from here. Deleting them is the same
     * rule as deselecting a page, applied to every page at once.
     */
    @Transactional(rollbackOn = Exception.class)
    public void deleteSource(UUID integrationId) throws GendoxException {
        List<UUID> documentInstanceIds = webScrapePageRepository.findAllByIntegrationId(integrationId)
                .stream()
                .map(WebScrapePage::getDocumentInstanceId)
                .filter(Objects::nonNull)
                .toList();

        // deleteAllDocumentInstances refuses an empty list, and a source that was
        // never scraped has one
        if (!documentInstanceIds.isEmpty()) {
            documentService.deleteAllDocumentInstances(documentInstanceIds);
        }

        integrationRepository.deleteById(integrationId);
    }

    private Integration loadAndCheckPlan(UUID integrationId) throws GendoxException {

        Integration integration = loadIntegration(integrationId);

        if (!subscriptionValidationService.canUseWebScrape(integration.getOrganizationId())) {
            throw new GendoxException("WEB_SCRAPE_NOT_IN_PLAN",
                    "Web scraping is not included in the plan of organization "
                            + integration.getOrganizationId(),
                    HttpStatus.FORBIDDEN);
        }

        return integration;
    }

    private Integration loadIntegration(UUID integrationId) throws GendoxException {
        return integrationRepository.findById(integrationId)
                .orElseThrow(() -> new GendoxException("INTEGRATION_NOT_FOUND",
                        "Integration not found: " + integrationId, HttpStatus.NOT_FOUND));
    }

    private void savePages(Integration integration, WebCrawlResultDTO result) {

        Instant now = Instant.now();

        for (DiscoveredPageDTO discovered : result.getPages()) {
            String url = normalizeUrl(discovered.getUrl());

            WebScrapePage page = webScrapePageRepository
                    .findByIntegrationIdAndUrl(integration.getId(), url)
                    .orElseGet(() -> {
                        WebScrapePage newPage = new WebScrapePage();
                        newPage.setIntegrationId(integration.getId());
                        newPage.setUrl(url);
                        newPage.setSelected(false);
                        newPage.setStatus(WebScrapePageStatusConstants.DISCOVERED);
                        newPage.setDiscoveredAt(now);
                        return newPage;
                    });

            page.setTitle(discovered.getTitle());
            page.setLastCrawledAt(now);
            webScrapePageRepository.save(page);
        }

        integration.setLastRunAt(now);
        integrationRepository.save(integration);
    }

    /**
     * The same page must not become two rows. Map returns urls without a trailing slash and crawl
     * returns them with one, and a fragment points inside a page that is already listed on its own.
     */
    private String normalizeUrl(String url) {
        String normalized = url.split("#")[0];

        return normalized.length() > 1 && normalized.endsWith("/")
                ? normalized.substring(0, normalized.length() - 1)
                : normalized;
    }

    private WebScrapeProvider resolveProvider(Map<String, Object> config) throws GendoxException {
        String providerName = (String) config.getOrDefault(
                WebScrapeConfigConstants.PROVIDER, FirecrawlConfig.PROVIDER_NAME);

        return webScrapeProviderUtils.getProvider(providerName);
    }

    private WebScrapeTargetDTO buildTarget(Integration integration, Map<String, Object> config) throws GendoxException {
        return WebScrapeTargetDTO.builder()
                .seedUrl(integration.getUrl())
                .apiKey(webScrapeProviderUtils.resolveApiKey(integration.getOrganizationId()))
                .crawlLimit((Integer) config.get(WebScrapeConfigConstants.CRAWL_PAGE_LIMIT))
                .build();
    }

    /**
     * Writes the schedule and the provider settings of the integration. Fields left null are kept.
     */
    public Integration updateSchedule(Integration integration, WebScrapeScheduleDTO scheduleDTO) throws GendoxException {

        if (scheduleDTO.getRunIntervalMinutes() != null) {
            if (scheduleDTO.getRunIntervalMinutes() < 1) {
                throw new GendoxException("WEB_SCRAPE_INTERVAL_INVALID",
                        "The run interval must be at least one minute", HttpStatus.BAD_REQUEST);
            }
            integration.setRunIntervalMinutes(scheduleDTO.getRunIntervalMinutes());
        }

        Map<String, Object> config = new HashMap<>(readConfig(integration));

        if (scheduleDTO.getProvider() != null) {
            // throws when the provider is not one we support
            webScrapeProviderUtils.getProvider(scheduleDTO.getProvider());
            config.put(WebScrapeConfigConstants.PROVIDER, scheduleDTO.getProvider());
        }

        if (scheduleDTO.getCrawlPageLimit() != null) {
            if (scheduleDTO.getCrawlPageLimit() < 1) {
                throw new GendoxException("WEB_SCRAPE_CRAWL_LIMIT_INVALID",
                        "The crawl page limit must be at least one page", HttpStatus.BAD_REQUEST);
            }
            config.put(WebScrapeConfigConstants.CRAWL_PAGE_LIMIT, scheduleDTO.getCrawlPageLimit());
        }

        integration.setConfig(writeConfig(integration, config));

        return integrationRepository.save(integration);
    }

    private String writeConfig(Integration integration, Map<String, Object> config) throws GendoxException {
        try {
            return objectMapper.writeValueAsString(config);
        } catch (JsonProcessingException e) {
            throw new GendoxException("WEB_SCRAPE_CONFIG_INVALID",
                    "Could not write the config of integration " + integration.getId(),
                    HttpStatus.BAD_REQUEST, e);
        }
    }

    private Map<String, Object> readConfig(Integration integration) throws GendoxException {
        String config = integration.getConfig();
        if (config == null || config.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(config, new TypeReference<Map<String, Object>>() {
            });
        } catch (JsonProcessingException e) {
            throw new GendoxException("WEB_SCRAPE_CONFIG_INVALID",
                    "Could not read the config of integration " + integration.getId(),
                    HttpStatus.BAD_REQUEST, e);
        }
    }

    private String slug(String url) {
        String withoutScheme = url.replaceFirst("^https?://", "");
        String slug = withoutScheme.toLowerCase().replaceAll("[^a-z0-9]+", "-");
        slug = slug.replaceAll("^-+|-+$", "");

        return slug.length() > 150 ? slug.substring(0, 150) : slug;
    }
}
