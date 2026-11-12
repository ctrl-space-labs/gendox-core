package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape;

import com.fasterxml.jackson.annotation.JsonCreator;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor(onConstructor_ = @JsonCreator)
@Builder(toBuilder = true)
public class WebCrawlResultDTO {
    @Builder.Default
    private List<DiscoveredPageDTO> pages = new ArrayList<>();
    private boolean limitReached;
}
