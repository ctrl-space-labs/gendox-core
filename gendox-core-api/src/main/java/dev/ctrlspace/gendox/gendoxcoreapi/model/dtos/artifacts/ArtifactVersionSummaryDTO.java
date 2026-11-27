package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * One version of an artifact, without its content.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ArtifactVersionSummaryDTO {
    private Integer version;
    private UUID messageId;
    private Instant createdAt;

    /**
     * Who made the version: in a shared artifact, any member who may edit it.
     */
    private UUID createdBy;
    /**
     * Filled in by the service, for every version at once.
     */
    private String createdByName;

    /**
     * For the repository's query, which reads no names.
     */
    public ArtifactVersionSummaryDTO(Integer version, UUID messageId, Instant createdAt, UUID createdBy) {
        this(version, messageId, createdAt, createdBy, null);
    }
}