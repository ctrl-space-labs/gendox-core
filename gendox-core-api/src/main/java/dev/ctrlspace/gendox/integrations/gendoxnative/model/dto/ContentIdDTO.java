package dev.ctrlspace.gendox.integrations.gendoxnative.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ContentIdDTO {
    private Long contentId;

    private String contentType; // post, page, product
    private Instant createdAt;
    private Instant updatedAt;
}