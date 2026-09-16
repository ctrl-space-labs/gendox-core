package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape.firecrawl.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class FirecrawlCrawlRequest {
    private String url;
    private Integer limit;
    private ScrapeOptions scrapeOptions;

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ScrapeOptions {
        private List<String> formats;
    }
}
