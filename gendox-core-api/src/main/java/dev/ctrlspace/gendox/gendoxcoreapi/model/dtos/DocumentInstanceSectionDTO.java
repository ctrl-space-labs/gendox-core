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
public class DocumentInstanceSectionDTO {

    private UUID id;
    private DocumentInstanceDTO documentInstanceDTO;
    private DocumentSectionMetadataDTO documentSectionMetadata;
    private String documentSectionIsccCode;
    private Double tokenCount;
    private String aiModelName;
    private String sectionValue;
    private UUID createdBy;
    private UUID updatedBy;
    private Instant createdAt;
    private Instant updatedAt;
    private String documentURL;
    private String ownerName;
    private Object signedPermissionOfUseVc;
    private Double distanceFromQuestion;
    private String distanceModelName;
}
