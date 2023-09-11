package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentSectionMetadata;
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
public class DocumentInstanceSectionDTO {

    private UUID id;
    //private DocumentInstance documentInstance;
    private DocumentSectionMetadataDTO documentSectionMetadataDTO;
    private String sectionValue;
    private Instant createdAt;
    private Instant updatedAt;
}
