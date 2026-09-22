package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class WebScrapePageDTO {
    private UUID id;
    private UUID integrationId;
    private String url;
    private String title;
    private Boolean isSelected;
    private String status;
    private UUID documentInstanceId;
    private Instant discoveredAt;
    private Instant lastCrawledAt;
    private Instant lastScrapedAt;
    private String errorMessage;
}
