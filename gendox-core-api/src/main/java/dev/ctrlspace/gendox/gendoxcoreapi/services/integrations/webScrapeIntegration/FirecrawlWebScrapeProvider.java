package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.webScrapeIntegration;


import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape.firecrawl.request.FirecrawlCrawlRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape.firecrawl.request.FirecrawlScrapeRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape.firecrawl.response.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.WebScrapeConstants;
import org.springframework.http.HttpHeaders;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape.DiscoveredPageDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape.WebCrawlResultDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape.WebPageContentDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape.WebScrapeTargetDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape.firecrawl.request.FirecrawlMapRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.CryptographyUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.webScrapeIntegration.utils.constants.FirecrawlConfig;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestTemplate;

import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.function.Supplier;

@Service
public class FirecrawlWebScrapeProvider implements WebScrapeProvider {

    Logger logger = LoggerFactory.getLogger(FirecrawlWebScrapeProvider.class);

    private Set<String> supportedProviderNames = Set.of(FirecrawlConfig.PROVIDER_NAME);
    private RestClient restClient;
    private CryptographyUtils cryptographyUtils;
    private String baseUrl;

    @Autowired
    public FirecrawlWebScrapeProvider(RestTemplate restTemplate,
                                      CryptographyUtils cryptographyUtils,
                                      @Value("${gendox.integrations.web-scrape.firecrawl.base-url}") String baseUrl) {
        this.restClient = RestClient.create(restTemplate);
        this.cryptographyUtils = cryptographyUtils;
        this.baseUrl = baseUrl;
    }


    @Override
    public WebCrawlResultDTO crawl(WebScrapeTargetDTO target) throws GendoxException {
        FirecrawlMapRequest request = FirecrawlMapRequest.builder()
                .url(target.getSeedUrl())
                .limit(target.getCrawlLimit())
                .build();

        FirecrawlMapResponse response = call("WEB_SCRAPE_MAP_FAILED", "map", () -> restClient.post()
                .uri(baseUrl + FirecrawlConfig.MAP_PATH)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + target.getApiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(FirecrawlMapResponse.class));


        if (response == null || !Boolean.TRUE.equals(response.getSuccess())) {
            throw new GendoxException("WEB_SCRAPE_MAP_FAILED",
                    "Firecrawl map failed for " + target.getSeedUrl(),
                    HttpStatus.BAD_GATEWAY);
        }

        if (response.getWarning() != null) {
            logger.warn("Firecrawl map warning for {}: {}", target.getSeedUrl(), response.getWarning());
        }

        List<DiscoveredPageDTO> discoveredPages = new ArrayList<>();
        if (response.getLinks() != null) {
            for (FirecrawlMapResponse.Link link : response.getLinks()) {
                if (isPageUrl(link.getUrl())) {
                    discoveredPages.add(DiscoveredPageDTO.builder()
                            .url(link.getUrl())
                            .title(link.getTitle())
                            .build());

                }
            }
        }

        return WebCrawlResultDTO.builder()
                .pages(discoveredPages)
                .limitReached(false)
                .build();

    }


    @Override
    public WebCrawlResultDTO deepCrawl(WebScrapeTargetDTO target) throws GendoxException {
        FirecrawlCrawlRequest request = FirecrawlCrawlRequest.builder()
                .url(target.getSeedUrl())
                .limit(target.getCrawlLimit())
                .scrapeOptions(FirecrawlCrawlRequest.ScrapeOptions.builder()
                        .formats(List.of(FirecrawlConfig.FORMAT_LINKS))
                        .build())
                .build();

        FirecrawlCrawlStartResponse start = call("WEB_SCRAPE_CRAWL_FAILED", "crawl", () -> restClient.post()
                .uri(baseUrl + FirecrawlConfig.CRAWL_PATH)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + target.getApiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(FirecrawlCrawlStartResponse.class));


        if (start == null || !Boolean.TRUE.equals(start.getSuccess()) || start.getId() == null) {
            throw new GendoxException("WEB_SCRAPE_CRAWL_FAILED",
                    "Firecrawl crawl did not start for " + target.getSeedUrl(),
                    HttpStatus.BAD_GATEWAY);
        }

        String statusUrl = baseUrl + FirecrawlConfig.CRAWL_PATH + "/" + start.getId();
        FirecrawlCrawlStatusResponse status = waitForCrawl(statusUrl, target.getApiKey());

        List<DiscoveredPageDTO> discoveredPages = new ArrayList<>();
        FirecrawlCrawlStatusResponse currentPage = status;
        while (currentPage != null) {
            addDiscoveredPages(currentPage, discoveredPages);
            currentPage = currentPage.getNext() == null
                    ? null
                    : getCrawlStatus(currentPage.getNext(), target.getApiKey());
        }

        boolean limitReached = target.getCrawlLimit() != null
                && status.getTotal() != null
                && status.getTotal() >= target.getCrawlLimit();

        return WebCrawlResultDTO.builder()
                .pages(discoveredPages)
                .limitReached(limitReached)
                .build();
    }

    @Override
    public WebPageContentDTO scrape(WebScrapeTargetDTO target, String url) throws GendoxException {

        FirecrawlScrapeRequest request = FirecrawlScrapeRequest.builder()
                .url(url)
                .formats(List.of(FirecrawlConfig.FORMAT_MARKDOWN))
                .onlyMainContent(true)
                .build();


        FirecrawlScrapeResponse response = call("WEB_SCRAPE_SCRAPE_FAILED", "scrape", () -> restClient.post()
                .uri(baseUrl + FirecrawlConfig.SCRAPE_PATH)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + target.getApiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(FirecrawlScrapeResponse.class));


        if (response == null || !Boolean.TRUE.equals(response.getSuccess()) || response.getData() == null) {
            throw new GendoxException("WEB_SCRAPE_SCRAPE_FAILED",
                    "Firecrawl scrape failed for " + url,
                    HttpStatus.BAD_GATEWAY);
        }

        if (response.getWarning() != null) {
            logger.warn("Firecrawl scrape warning for {}: {}", url, response.getWarning());
        }

        FirecrawlScrapeResponse.ScrapeData data = response.getData();
        FirecrawlPageMetadata metadata = data.getMetadata() != null
                ? data.getMetadata()
                : new FirecrawlPageMetadata();

        if (metadata.getStatusCode() != null && metadata.getStatusCode() >= 400) {
            boolean pageIsGone = metadata.getStatusCode() == 404 || metadata.getStatusCode() == 410;

            throw new GendoxException(pageIsGone ? WebScrapeConstants.ErrorCodes.PAGE_NOT_FOUND : WebScrapeConstants.ErrorCodes.PAGE_FAILED,
                    "Page " + url + " returned HTTP " + metadata.getStatusCode(),
                    HttpStatus.BAD_GATEWAY);
        }

        if (data.getMarkdown() == null || data.getMarkdown().isBlank()) {
            throw new GendoxException(WebScrapeConstants.ErrorCodes.PAGE_FAILED,
                    "Page " + url + " has no content",
                    HttpStatus.BAD_GATEWAY);
        }


        return WebPageContentDTO.builder()
                .url(metadata.getSourceUrl() != null ? metadata.getSourceUrl() : url)
                .title(metadata.getTitle())
                .markdown(data.getMarkdown())
                .contentHash(calculateHash(data.getMarkdown()))
                .fetchedAt(Instant.now())
                .build();


    }

    @Override
    public Set<String> getSupportedProviderNames() {
        return supportedProviderNames;
    }

    @Override
    public boolean supports(String providerName) {
        return providerName != null && supportedProviderNames.contains(providerName);
    }


    // for map endpoint
    private boolean isPageUrl(String url) {
        if (url == null) {
            return false;
        }
        for (String extension : FirecrawlConfig.NON_PAGE_EXTENSIONS) {
            if (url.toLowerCase().endsWith(extension)) {
                return false;
            }
        }
        return true;
    }


    // for scrape endpoint
    private String calculateHash(String markdown) throws GendoxException {
        try {
            return cryptographyUtils.calculateSHA256(markdown);
        } catch (NoSuchAlgorithmException e) {
            throw new GendoxException("WEB_SCRAPE_HASH_FAILED",
                    "Could not calculate the content hash",
                    HttpStatus.INTERNAL_SERVER_ERROR, e);
        }
    }

    // for crawl endpoint
    private FirecrawlCrawlStatusResponse waitForCrawl(String statusUrl, String apiKey) throws GendoxException {
        long deadline = System.currentTimeMillis() + FirecrawlConfig.CRAWL_TIMEOUT_MILLIS;

        while (true) {
            FirecrawlCrawlStatusResponse status = getCrawlStatus(statusUrl, apiKey);

            if (FirecrawlConfig.CRAWL_STATUS_COMPLETED.equals(status.getStatus())) {
                return status;
            }

            if (FirecrawlConfig.CRAWL_STATUS_FAILED.equals(status.getStatus())) {
                throw new GendoxException("WEB_SCRAPE_CRAWL_FAILED",
                        "Firecrawl crawl failed: " + status.getError(),
                        HttpStatus.BAD_GATEWAY);
            }

            if (System.currentTimeMillis() > deadline) {
                throw new GendoxException("WEB_SCRAPE_CRAWL_FAILED",
                        "Firecrawl crawl did not finish in time",
                        HttpStatus.GATEWAY_TIMEOUT);
            }

            try {
                Thread.sleep(FirecrawlConfig.CRAWL_POLL_INTERVAL_MILLIS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new GendoxException("WEB_SCRAPE_CRAWL_FAILED",
                        "Waiting for the Firecrawl crawl was interrupted",
                        HttpStatus.BAD_GATEWAY, e);
            }
        }
    }

    // for crawl endpoint
    private FirecrawlCrawlStatusResponse getCrawlStatus(String url, String apiKey) throws GendoxException {
        FirecrawlCrawlStatusResponse status = call("WEB_SCRAPE_CRAWL_FAILED", "crawl status", () -> restClient.get()
                .uri(url)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .retrieve()
                .body(FirecrawlCrawlStatusResponse.class));


        if (status == null) {
            throw new GendoxException("WEB_SCRAPE_CRAWL_FAILED",
                    "Firecrawl crawl status was empty",
                    HttpStatus.BAD_GATEWAY);
        }

        return status;
    }

    private void addDiscoveredPages(FirecrawlCrawlStatusResponse status, List<DiscoveredPageDTO> discoveredPages) {
        if (status.getData() == null) {
            return;
        }

        for (FirecrawlCrawlStatusResponse.CrawledPage crawledPage : status.getData()) {
            FirecrawlPageMetadata metadata = crawledPage.getMetadata();
            if (metadata != null && isPageUrl(metadata.getSourceUrl())) {
                discoveredPages.add(DiscoveredPageDTO.builder()
                        .url(metadata.getSourceUrl())
                        .title(metadata.getTitle())
                        .build());
            }
        }
    }


    /**
     * One request to Firecrawl. A 429 or a 5xx is tried again, after the Retry-After it sends or a doubling
     * wait; anything else (a rejected key, no credits) fails at once, because asking again changes nothing.
     * A 429 that outlasts the attempts fails as RATE_LIMITED, so the caller can stop instead of failing every page.
     */
    private <T> T call(String errorCode, String action, Supplier<T> request) throws GendoxException {
        for (int attempt = 1; ; attempt++) {
            try {
                return request.get();
            } catch (HttpStatusCodeException e) {
                int status = e.getStatusCode().value();
                boolean retryable = status == 429 || status >= 500;

                if (!retryable || attempt == FirecrawlConfig.MAX_ATTEMPTS) {
                    boolean rateLimited = status == 429;
                    throw new GendoxException(rateLimited ? WebScrapeConstants.ErrorCodes.RATE_LIMITED : errorCode,
                            "Firecrawl " + action + " failed with HTTP " + status,
                            rateLimited ? HttpStatus.TOO_MANY_REQUESTS : HttpStatus.BAD_GATEWAY, e);
                }

                long waitMillis = retryAfterMillis(e, attempt);
                logger.info("Firecrawl {} answered HTTP {}, trying again in {} ms", action, status, waitMillis);
                try {
                    Thread.sleep(waitMillis);
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    throw new GendoxException(errorCode, "Waiting to retry Firecrawl " + action + " was interrupted",
                            HttpStatus.BAD_GATEWAY, interrupted);
                }
            }
        }
    }

    private long retryAfterMillis(HttpStatusCodeException e, int attempt) {
        String retryAfter = e.getResponseHeaders() == null ? null : e.getResponseHeaders().getFirst(HttpHeaders.RETRY_AFTER);
        if (retryAfter != null) {
            try {
                return Math.min(Long.parseLong(retryAfter.trim()) * 1000L, FirecrawlConfig.MAX_RETRY_WAIT_MILLIS);
            } catch (NumberFormatException ignored) {
                // an HTTP date instead of seconds: the doubling wait below
            }
        }
        return FirecrawlConfig.RETRY_BASE_WAIT_MILLIS << (attempt - 1);
    }


}
