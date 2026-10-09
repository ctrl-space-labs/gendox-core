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

        if (!subscriptionValidationService.canUseWebScrape(integration.getOrganizationId())) {
            logger.info("Web scraping is not included in the plan of organization {}, skipping integration {}",
                    integration.getOrganizationId(), integration.getId());
            return Map.of();
        }

        discoverPages(integration);
        syncSelectedPages(integration);

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
     * Brings the project in line with what is ticked, which is the only statement of what
     * belongs in it: a ticked page is fetched, or fetched again so its document stays
     * current, and an unticked page that still has a document loses it.
     * <p>
     * The scheduled pass and the Read button run this same method, because they answer the
     * same question — does the project match the settings? Before this, the button read what
     * was ticked while the scheduler refreshed whatever happened to have a document, and the
     * two sets had nothing to do with each other.
     */
    public void syncSelectedPages(Integration integration) throws GendoxException {

        List<WebScrapePage> pages = webScrapePageRepository.findAllByIntegrationId(integration.getId())
                .stream()
                .filter(page -> !WebScrapePageStatusConstants.REMOVED.equals(page.getStatus()))
                .toList();

        dropContent(pages.stream()
                .filter(page -> !Boolean.TRUE.equals(page.getSelected()))
                .filter(page -> page.getDocumentInstanceId() != null)
                .toList());

        scrapePages(integration, pages.stream()
                .filter(page -> Boolean.TRUE.equals(page.getSelected()))
                .toList());
    }

    private void scrapePages(Integration integration, List<WebScrapePage> pages) throws GendoxException {

        Map<String, Object> config = readConfig(integration);
        WebScrapeProvider provider = resolveProvider(config);
        WebScrapeTargetDTO target = buildTarget(integration, config);

        // oldest first, so a budget that runs out leaves the freshest pages behind
        List<WebScrapePage> ordered = pages.stream()
                .sorted(Comparator.comparing(WebScrapePage::getLastScrapedAt,
                        Comparator.nullsFirst(Comparator.naturalOrder())))
                .toList();

        for (WebScrapePage page : ordered) {
            if (!subscriptionValidationService.canScrapeWebPages(integration.getOrganizationId(), 1)) {
                logger.info("Monthly web scraping budget reached for organization {}, deferring the remaining pages",
                        integration.getOrganizationId());
                break;
            }

            try {
                WebPageContentDTO content = provider.scrape(target, page.getUrl());
                page.setLastScrapedAt(Instant.now());

                // the page told us its name while we were reading it
                if (content.getTitle() != null && !content.getTitle().isBlank()) {
                    page.setTitle(content.getTitle());
                }

                // the hash alone is not enough: a document can be deleted from
                // elsewhere, and the FK then nulls the link while the hash stays —
                // without this the page would read as unchanged and never come back
                if (page.getDocumentInstanceId() == null
                        || !content.getContentHash().equals(page.getContentHash())) {
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

        // a pass with nothing ticked only removes content, and removing costs nothing:
        // refusing it would leave an organization at its limit unable to take pages out
        boolean fetchesSomething = webScrapePageRepository.findAllByIntegrationId(integrationId)
                .stream()
                .anyMatch(page -> Boolean.TRUE.equals(page.getSelected())
                        && !WebScrapePageStatusConstants.REMOVED.equals(page.getStatus()));

        if (fetchesSomething) {
            requireBudget(integration);
        }
    }

    /**
     * One page is about to be fetched, so the plan and the monthly budget both apply.
     */
    public void validatePageFetch(UUID integrationId) throws GendoxException {
        requireBudget(loadAndCheckPlan(integrationId));
    }

    private void requireBudget(Integration integration) throws GendoxException {
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
            Integration integration = loadIntegration(integrationId);
            discoverPages(integration);
            stampRun(integration);
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
            Integration integration = loadIntegration(integrationId);
            deepDiscoverPages(integration);
            stampRun(integration);
        } catch (Exception e) {
            logger.error("Error deep crawling the site of web scrape integration {}", integrationId, e);
        }
    }

    @Async
    @SchedulerLock(name = "webScrapeManualTrigger-#{#integrationId}",
            lockAtMostFor = "PT30M", lockAtLeastFor = "PT5S")
    public void triggerScrape(UUID integrationId) {
        try {
            logger.info("Bringing the project in line with the selected pages of web scrape integration {}", integrationId);
            Integration integration = loadIntegration(integrationId);
            syncSelectedPages(integration);
            stampRun(integration);
        } catch (Exception e) {
            logger.error("Error scraping the selected pages of web scrape integration {}", integrationId, e);
        }
    }

    /**
     * Takes one page's content out of the project now, instead of waiting for the next pass.
     * Unticking the page says the same thing; this is the impatient version of it.
     */
    @Transactional(rollbackOn = Exception.class)
    public void removeContent(UUID integrationId, UUID pageId) throws GendoxException {

        WebScrapePage page = webScrapePageRepository.findById(pageId)
                .filter(stored -> integrationId.equals(stored.getIntegrationId()))
                .orElseThrow(() -> new GendoxException("WEB_SCRAPE_PAGE_NOT_FOUND",
                        "Web scrape page not found: " + pageId, HttpStatus.NOT_FOUND));

        // asking for the content to go is asking for it not to come back on the next pass
        page.setSelected(false);

        dropContent(List.of(page));
    }

    /**
     * Reads one page now, instead of waiting for a pass over the whole site.
     * <p>
     * Ticking it is part of the request, not a side effect: a page fetched and left unticked
     * would lose its document on the next pass, which is not what the button offers.
     * <p>
     * Synchronous on purpose. One page is a single fetch, and an answer the caller can wait
     * for beats a 202 and a table that has to guess when to reload.
     */
    @Transactional(rollbackOn = Exception.class)
    public void fetchPage(UUID integrationId, UUID pageId) throws GendoxException {

        WebScrapePage page = webScrapePageRepository.findById(pageId)
                .filter(stored -> integrationId.equals(stored.getIntegrationId()))
                .orElseThrow(() -> new GendoxException("WEB_SCRAPE_PAGE_NOT_FOUND",
                        "Web scrape page not found: " + pageId, HttpStatus.NOT_FOUND));

        if (WebScrapePageStatusConstants.REMOVED.equals(page.getStatus())) {
            throw new GendoxException("WEB_SCRAPE_PAGE_GONE",
                    "This page is no longer on the site", HttpStatus.CONFLICT);
        }

        page.setSelected(true);

        scrapePages(loadIntegration(integrationId), List.of(page));
    }

    /**
     * Takes the content of several pages out of the project in one statement, so a sync that
     * drops twenty documents is one deletion rather than twenty.
     * <p>
     * The page rows stay. What is removed is their content, not their existence, so a page
     * can be read again later without crawling the site afresh.
     */
    private void dropContent(List<WebScrapePage> pages) throws GendoxException {

        if (pages.isEmpty()) {
            return;
        }

        List<UUID> documentInstanceIds = pages.stream()
                .map(WebScrapePage::getDocumentInstanceId)
                .filter(Objects::nonNull)
                .toList();

        if (!documentInstanceIds.isEmpty()) {
            documentService.deleteAllDocumentInstances(documentInstanceIds);
        }

        for (WebScrapePage page : pages) {
            page.setDocumentInstanceId(null);
            page.setContentHash(null);

            // a page that is gone from the site keeps saying so
            if (!WebScrapePageStatusConstants.REMOVED.equals(page.getStatus())) {
                page.setStatus(WebScrapePageStatusConstants.DISCOVERED);
            }

            webScrapePageRepository.save(page);
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

    /**
     * Every path that does work says when it did it, not only the scheduled pass. The manual
     * actions here never reach IntegrationManager, which is where the scheduled pass is
     * stamped, and the panel reads this field to know a run has ended — so a path that does
     * not stamp leaves the screen waiting for something that never arrives.
     */
    private void stampRun(Integration integration) {
        integration.setLastRunAt(Instant.now());
        integrationRepository.save(integration);
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

            // the map usually returns no title, and a page that has been read has a
            // real one; letting a null overwrite it loses the name at every crawl
            if (discovered.getTitle() != null && !discovered.getTitle().isBlank()) {
                page.setTitle(discovered.getTitle());
            }
            page.setLastCrawledAt(now);
            webScrapePageRepository.save(page);
        }
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
