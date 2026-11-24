package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * An artifact in the list of a thread: no content and no versions.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ArtifactSummaryDTO {
    private UUID id;
    private UUID threadId;
    /**
     * The conversation's name, in a list across conversations; null in a thread's own list, which knows it.
     */
    private String threadName;
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
    private String ownerName;

}