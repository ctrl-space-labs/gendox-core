package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * An artifact with its versions and the content of one of them. {@code version} says which one:
 * the latest, unless an earlier one was asked for.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ArtifactDTO {
    private UUID id;
    private UUID threadId;
    private String title;
    private Type artifactType;
    private String codeLanguage;
    private Type display;
    private Integer latestVersion;
    private Instant createdAt;
    private Instant updatedAt;
    private UUID createdBy;
    private UUID updatedBy;
    private UUID ownerId;
    private String yourRole;
    private List<ArtifactVersionSummaryDTO> versions;
    private Integer version;
    private String content;
}