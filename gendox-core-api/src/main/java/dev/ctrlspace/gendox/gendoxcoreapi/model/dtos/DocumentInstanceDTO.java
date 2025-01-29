package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class DocumentInstanceDTO {

    private UUID id;
    private UUID organizationId;
    private UUID documentTemplateId;
    private String documentIsccCode;
    private String remoteUrl;
    private String documentSha256Hash;
    private Type fileType;
    private Long contentId;
    private String externalUrl;
    private String title;
    private UUID createdBy;
    private UUID updatedBy;
    private Instant createAt;
    private Instant updateAt;
    private List<DocumentInstanceSectionDTO> documentInstanceSections = new ArrayList<>();
    private Long fileSizeBytes;

}
