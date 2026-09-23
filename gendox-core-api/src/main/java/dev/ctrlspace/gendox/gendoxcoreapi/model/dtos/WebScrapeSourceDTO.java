package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class WebScrapeSourceDTO {
    private String name;
    private String url;
    private UUID projectId;
    private Integer runIntervalMinutes;
    private Integer crawlPageLimit;
    private String provider;
}
