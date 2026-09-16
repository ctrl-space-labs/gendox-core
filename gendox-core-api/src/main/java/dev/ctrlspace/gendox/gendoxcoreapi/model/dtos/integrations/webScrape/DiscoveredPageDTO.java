package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class DiscoveredPageDTO {
    private String url;
    private String title;
}
