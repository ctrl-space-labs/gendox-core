package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.OrganizationConnectorConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationConnector;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationConnectorService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.webScrapeIntegration.WebScrapeProvider;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ConnectorTypesConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.WebScrapeConfigConstants;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class WebScrapeProviderUtils {

    private final List<WebScrapeProvider> webScrapeProviders;
    private OrganizationConnectorService organizationConnectorService;
    private OrganizationConnectorConverter organizationConnectorConverter;
    private String platformApiKey;



    @Autowired
    public WebScrapeProviderUtils(List<WebScrapeProvider> webScrapeProviders,
                                  OrganizationConnectorService organizationConnectorService,
                                  OrganizationConnectorConverter organizationConnectorConverter,
                                  @Value("${gendox.integrations.web-scrape.firecrawl.api-key:}") String platformApiKey) {
        this.webScrapeProviders = webScrapeProviders;
        this.organizationConnectorService = organizationConnectorService;
        this.organizationConnectorConverter = organizationConnectorConverter;
        this.platformApiKey = platformApiKey;
    }

    public WebScrapeProvider getProvider(String providerName) throws GendoxException {
        for (WebScrapeProvider provider : webScrapeProviders) {
            if (provider.supports(providerName)) {
                return provider;
            }
        }
        throw new GendoxException(
                "WEB_SCRAPE_PROVIDER_NOT_SUPPORTED",
                "Web scrape provider not supported: " + providerName,
                HttpStatus.BAD_REQUEST);
    }

    public String resolveApiKey(UUID organizationId) throws GendoxException {
        String organizationApiKey = getOrganizationApiKey(organizationId);

        if (organizationApiKey != null && !organizationApiKey.isBlank()) {
            return organizationApiKey;
        }

        if (platformApiKey == null || platformApiKey.isBlank()) {
            throw new GendoxException("WEB_SCRAPE_API_KEY_NOT_FOUND",
                    "No web scrape API key found for organization " + organizationId,
                    HttpStatus.BAD_REQUEST);
        }

        return platformApiKey;
    }


    private String getOrganizationApiKey(UUID organizationId) throws GendoxException {
        OrganizationConnector connector;

        try {
            connector = organizationConnectorService.getByOrganizationAndType(
                    organizationId, ConnectorTypesConstants.WEB_SCRAPE_FIRECRAWL);
        } catch (GendoxException e) {
            if ("ORGANIZATION_CONNECTOR_NOT_FOUND".equals(e.getErrorCode())) {
                return null;
            }
            throw e;
        }

        if (!Boolean.TRUE.equals(connector.getActive())) {
            return null;
        }

        Object apiKey = organizationConnectorConverter.toDTO(connector).getConfig().get(WebScrapeConfigConstants.API_KEY);

        return apiKey == null ? null : apiKey.toString();
    }
}
