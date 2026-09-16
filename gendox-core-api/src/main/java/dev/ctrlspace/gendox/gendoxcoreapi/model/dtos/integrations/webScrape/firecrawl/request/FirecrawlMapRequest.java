package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape.firecrawl.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class FirecrawlMapRequest {
    private String url;
    private Integer limit;
}
