package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

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
    private Integer latestVersion;
    private Instant createdAt;
    private Instant updatedAt;
    private UUID createdBy;
    private UUID updatedBy;

    /**
     * The one person who made it.
     */
    private UUID ownerId;

    /**
     * The signed-in user's role when it is opened by its own id: VIEW, INTERACT, EDIT or OWNER. Null when it is read
     * through its conversation, whose member is its owner.
     */
    private String yourRole;


    /**
     * Every version, oldest first, without content.
     */
    private List<ArtifactVersionSummaryDTO> versions;

    /**
     * The version whose content is below.
     */
    private Integer version;
    private String content;
}