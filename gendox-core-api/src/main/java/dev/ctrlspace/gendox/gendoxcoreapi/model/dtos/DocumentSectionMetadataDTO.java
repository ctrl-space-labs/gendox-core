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
public class DocumentSectionMetadataDTO {

    private UUID id;
    private UUID documentTemplateId;
    private Long documentSectionTypeId;
    private String title;
    private String description;
    private String sectionOptions;
    private Integer sectionOrder;
    private Instant createdAt;
    private Instant updatedAt;
}
