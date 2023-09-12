package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

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
public class DocumentDTO {

    private UUID id;
    private UUID organizationId;
    private UUID documentTemplateId;
    private UUID userId;
    private String remoteUrl;
    private Instant createAt;
    private Instant updateAt;

    private List<UUID> documentInstanceSectionIds;


    private List<DocumentInstanceSectionDTO> documentInstanceSections = new ArrayList<>();

}
