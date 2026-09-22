package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.WebScrapePage;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.WebScrapePageDTO;
import org.springframework.stereotype.Component;

@Component
public class WebScrapePageConverter implements GendoxConverter<WebScrapePage, WebScrapePageDTO> {

    @Override
    public WebScrapePageDTO toDTO(WebScrapePage webScrapePage) {
        WebScrapePageDTO webScrapePageDTO = new WebScrapePageDTO();
        webScrapePageDTO.setId(webScrapePage.getId());
        webScrapePageDTO.setIntegrationId(webScrapePage.getIntegrationId());
        webScrapePageDTO.setUrl(webScrapePage.getUrl());
        webScrapePageDTO.setTitle(webScrapePage.getTitle());
        webScrapePageDTO.setIsSelected(webScrapePage.getSelected());
        webScrapePageDTO.setStatus(webScrapePage.getStatus());
        webScrapePageDTO.setDocumentInstanceId(webScrapePage.getDocumentInstanceId());
        webScrapePageDTO.setDiscoveredAt(webScrapePage.getDiscoveredAt());
        webScrapePageDTO.setLastCrawledAt(webScrapePage.getLastCrawledAt());
        webScrapePageDTO.setLastScrapedAt(webScrapePage.getLastScrapedAt());
        webScrapePageDTO.setErrorMessage(webScrapePage.getErrorMessage());

        return webScrapePageDTO;
    }

    @Override
    public WebScrapePage toEntity(WebScrapePageDTO webScrapePageDTO) {
        WebScrapePage webScrapePage = new WebScrapePage();
        webScrapePage.setId(webScrapePageDTO.getId());
        webScrapePage.setIntegrationId(webScrapePageDTO.getIntegrationId());
        webScrapePage.setUrl(webScrapePageDTO.getUrl());
        webScrapePage.setTitle(webScrapePageDTO.getTitle());
        webScrapePage.setSelected(webScrapePageDTO.getIsSelected());
        webScrapePage.setStatus(webScrapePageDTO.getStatus());

        return webScrapePage;
    }
}
