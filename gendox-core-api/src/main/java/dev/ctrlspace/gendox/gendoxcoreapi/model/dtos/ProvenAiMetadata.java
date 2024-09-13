package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ProvenAiMetadata {
    private UUID sectionId;
    private String iscc;
    private String title;
    private String documentURL;
    private Double tokens;
    private String ownerName;
    private Object signedPermissionOfUseVc;
    private String aiModelName;
}
