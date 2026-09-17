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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

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

        Map<String, Object> config = readConfig(integration);
        String providerName = (String) config.getOrDefault(
                WebScrapeConfigConstants.PROVIDER, FirecrawlConfig.PROVIDER_NAME);
        Integer crawlPageLimit = (Integer) config.get(WebScrapeConfigConstants.CRAWL_PAGE_LIMIT);

        WebScrapeProvider provider = webScrapeProviderUtils.getProvider(providerName);

        WebScrapeTargetDTO target = WebScrapeTargetDTO.builder()
                .seedUrl(integration.getUrl())
                .apiKey(webScrapeProviderUtils.resolveApiKey(integration.getOrganizationId()))
                .crawlLimit(crawlPageLimit)
                .build();

        WebCrawlResultDTO result = provider.crawl(target);
        Instant now = Instant.now();

        for (DiscoveredPageDTO discovered : result.getPages()) {
            WebScrapePage page = webScrapePageRepository
                    .findByIntegrationIdAndUrl(integration.getId(), discovered.getUrl())
                    .orElseGet(() -> {
                        WebScrapePage newPage = new WebScrapePage();
                        newPage.setIntegrationId(integration.getId());
                        newPage.setUrl(discovered.getUrl());
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

        if (selectedPages.isEmpty()) {
            return Map.of();
        }

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

        return Map.of();
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
