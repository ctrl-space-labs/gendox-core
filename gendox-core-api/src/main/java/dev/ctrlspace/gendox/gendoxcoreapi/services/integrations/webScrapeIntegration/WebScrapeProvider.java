package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.webScrapeIntegration;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape.WebCrawlResultDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape.WebPageContentDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape.WebScrapeTargetDTO;

import java.util.Set;

public interface WebScrapeProvider {

    WebCrawlResultDTO crawl(WebScrapeTargetDTO target) throws GendoxException;

    WebCrawlResultDTO deepCrawl(WebScrapeTargetDTO target) throws GendoxException;

    WebPageContentDTO scrape(WebScrapeTargetDTO target, String url) throws GendoxException;

    Set<String> getSupportedProviderNames();

    boolean supports(String providerName);

}
