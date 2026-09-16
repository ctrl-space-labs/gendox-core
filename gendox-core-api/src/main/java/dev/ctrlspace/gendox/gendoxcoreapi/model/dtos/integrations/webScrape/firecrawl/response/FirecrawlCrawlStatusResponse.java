package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape.firecrawl.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class FirecrawlCrawlStatusResponse {
    private Boolean success;
    private String status;
    private Integer total;
    private Integer completed;
    private Integer creditsUsed;
    private String next;
    private List<CrawledPage> data;
    private String warning;
    private String error;

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CrawledPage {
        private FirecrawlPageMetadata metadata;
    }
}
