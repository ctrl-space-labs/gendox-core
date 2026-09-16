package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.webScrapeIntegration;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape.WebCrawlResultDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape.WebPageContentDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape.WebScrapeTargetDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.CryptographyUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class FirecrawlWebScrapeProviderTest {

    private static final String BASE_URL = "https://api.firecrawl.dev/v2";
    private static final String API_KEY = "fc-test-key";
    private static final String CRAWL_ID = "01a0a02d-c773-7351-a528-c2744524e096";

    private CryptographyUtils cryptographyUtils;
    private MockRestServiceServer server;
    private FirecrawlWebScrapeProvider provider;

    @BeforeEach
    void setUp() {
        RestTemplate restTemplate = new RestTemplate();
        cryptographyUtils = new CryptographyUtils();
        server = MockRestServiceServer.bindTo(restTemplate).build();
        provider = new FirecrawlWebScrapeProvider(restTemplate, cryptographyUtils, BASE_URL);
    }

    @Test
    void crawl_returnsPagesAndSkipsNonPageLinks() throws Exception {
        server.expect(requestTo(BASE_URL + "/map"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer " + API_KEY))
                .andRespond(withSuccess(fixture("firecrawl/map-with-non-page-link.json"), MediaType.APPLICATION_JSON));

        WebCrawlResultDTO result = provider.crawl(target());

        server.verify();

        assertEquals(2, result.getPages().size());
        assertEquals("https://docs.gendox.dev", result.getPages().get(0).getUrl());
        assertEquals("Gendox: Introduction", result.getPages().get(0).getTitle());
        assertEquals("https://docs.gendox.dev/earth-observation/architecture", result.getPages().get(1).getUrl());
        assertNull(result.getPages().get(1).getTitle());
        assertFalse(result.isLimitReached());
    }

    @Test
    void crawl_failsWhenFirecrawlRejectsTheApiKey() {
        server.expect(requestTo(BASE_URL + "/map"))
                .andRespond(withStatus(HttpStatus.UNAUTHORIZED));

        GendoxException exception = assertThrows(GendoxException.class, () -> provider.crawl(target()));

        server.verify();
        assertEquals("WEB_SCRAPE_MAP_FAILED", exception.getErrorCode());
    }

    @Test
    void scrape_returnsMarkdownWithSourceUrlAndHash() throws Exception {
        server.expect(requestTo(BASE_URL + "/scrape"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer " + API_KEY))
                .andRespond(withSuccess(fixture("firecrawl/scrape-document-digitization.json"),
                        MediaType.APPLICATION_JSON));

        // the trailing slash is dropped, because the url comes from the metadata sourceURL
        WebPageContentDTO content = provider.scrape(target(),
                "https://docs.gendox.dev/document-digitization/document-digitization/");

        server.verify();

        assertEquals("https://docs.gendox.dev/document-digitization/document-digitization", content.getUrl());
        assertEquals("Document Digitization | Gendox", content.getTitle());
        assertEquals(cryptographyUtils.calculateSHA256(content.getMarkdown()), content.getContentHash());
    }

    @Test
    void scrape_failsWhenThePageIsNotFound() {
        server.expect(requestTo(BASE_URL + "/scrape"))
                .andRespond(withSuccess(fixture("firecrawl/scrape-not-found.json"), MediaType.APPLICATION_JSON));

        GendoxException exception = assertThrows(GendoxException.class,
                () -> provider.scrape(target(), "https://docs.gendox.dev/does-not-exist"));

        server.verify();
        assertEquals("WEB_SCRAPE_PAGE_FAILED", exception.getErrorCode());
    }

    @Test
    void scrape_failsWhenThePageHasNoContent() {
        server.expect(requestTo(BASE_URL + "/scrape"))
                .andRespond(withSuccess(fixture("firecrawl/scrape-empty-markdown.json"), MediaType.APPLICATION_JSON));

        GendoxException exception = assertThrows(GendoxException.class,
                () -> provider.scrape(target(), "https://docs.gendox.dev/empty"));

        server.verify();
        assertEquals("WEB_SCRAPE_PAGE_FAILED", exception.getErrorCode());
    }

    @Test
    void deepCrawl_followsNextPagesAndSkipsNonPageLinks() throws Exception {
        server.expect(requestTo(BASE_URL + "/crawl"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(fixture("firecrawl/crawl-start.json"), MediaType.APPLICATION_JSON));

        server.expect(requestTo(BASE_URL + "/crawl/" + CRAWL_ID))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(fixture("firecrawl/crawl-status-completed.json"), MediaType.APPLICATION_JSON));

        server.expect(requestTo(BASE_URL + "/crawl/" + CRAWL_ID + "?skip=2"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(fixture("firecrawl/crawl-status-next.json"), MediaType.APPLICATION_JSON));

        WebCrawlResultDTO result = provider.deepCrawl(target());

        server.verify();

        assertEquals(3, result.getPages().size());
        assertEquals("https://docs.gendox.dev", result.getPages().get(0).getUrl());
        assertEquals("https://docs.gendox.dev/earth-observation/architecture", result.getPages().get(1).getUrl());
        assertEquals("https://docs.gendox.dev/earth-observation/user-guide", result.getPages().get(2).getUrl());
        assertFalse(result.isLimitReached());
    }

    private WebScrapeTargetDTO target() {
        return WebScrapeTargetDTO.builder()
                .seedUrl("https://docs.gendox.dev")
                .apiKey(API_KEY)
                .crawlLimit(20)
                .build();
    }

    private String fixture(String path) {
        try {
            return new String(new ClassPathResource(path).getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Could not read test fixture: " + path, e);
        }
    }
}
