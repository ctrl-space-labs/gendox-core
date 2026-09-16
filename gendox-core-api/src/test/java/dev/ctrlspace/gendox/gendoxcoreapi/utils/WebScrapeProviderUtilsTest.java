package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationConnectorService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.webScrapeIntegration.FirecrawlWebScrapeProvider;
import dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.webScrapeIntegration.WebScrapeProvider;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.FirecrawlConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class WebScrapeProviderUtilsTest {

    private static final String PLATFORM_API_KEY = "fc-platform-key";

    private FirecrawlWebScrapeProvider firecrawlProvider;
    private OrganizationConnectorService organizationConnectorService;
    private WebScrapeProviderUtils webScrapeProviderUtils;

    @BeforeEach
    void setUp() {
        firecrawlProvider = new FirecrawlWebScrapeProvider(
                new RestTemplate(), new CryptographyUtils(), "https://api.firecrawl.dev/v2");
        organizationConnectorService = mock(OrganizationConnectorService.class);

        webScrapeProviderUtils = new WebScrapeProviderUtils(
                List.of(firecrawlProvider), organizationConnectorService, null, PLATFORM_API_KEY);
    }

    @Test
    void getProvider_returnsTheFirecrawlProvider() throws Exception {
        WebScrapeProvider provider = webScrapeProviderUtils.getProvider(FirecrawlConfig.PROVIDER_NAME);

        assertSame(firecrawlProvider, provider);
    }

    @Test
    void getProvider_failsForAnUnknownProvider() {
        GendoxException exception = assertThrows(GendoxException.class,
                () -> webScrapeProviderUtils.getProvider("BRIGHTDATA"));

        assertEquals("WEB_SCRAPE_PROVIDER_NOT_SUPPORTED", exception.getErrorCode());
    }

    @Test
    void resolveApiKey_usesThePlatformKeyWhenTheOrganizationHasNoConnector() throws Exception {
        UUID organizationId = UUID.randomUUID();
        when(organizationConnectorService.getByOrganizationAndType(eq(organizationId), any()))
                .thenThrow(new GendoxException("ORGANIZATION_CONNECTOR_NOT_FOUND",
                        "Connector not found", HttpStatus.NOT_FOUND));

        assertEquals(PLATFORM_API_KEY, webScrapeProviderUtils.resolveApiKey(organizationId));
    }
}
