package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.integrations.webScrape;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class WebPageContentDTO {
    private String url;
    private String title;
    @ToString.Exclude
    private String markdown;
    private String contentHash;
    private Instant fetchedAt;
}
