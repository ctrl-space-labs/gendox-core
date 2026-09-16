package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class WebCrawlResultDTO {
    @Builder.Default
    private List<DiscoveredPageDTO> pages = new ArrayList<>();
    private boolean limitReached;
}
