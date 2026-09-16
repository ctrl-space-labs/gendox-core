package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class WebScrapeTargetDTO {
    private String seedUrl;
    @ToString.Exclude
    private String apiKey;
    private Integer crawlLimit;
    @Builder.Default
    private List<String> includePaths = new ArrayList<>();
    @Builder.Default
    private List<String> excludePaths = new ArrayList<>();
}
