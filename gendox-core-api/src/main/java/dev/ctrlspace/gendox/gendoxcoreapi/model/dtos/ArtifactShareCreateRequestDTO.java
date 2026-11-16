package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * The owner's request to share an artifact. Replaces the active share with the same audience: the one for the whole
 * project, or the one with the same user.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ArtifactShareCreateRequestDTO {
    /** PROJECT: every member of the artifact's project. USER: sharedWithUserId alone. */
    private String audience;
    /** For audience USER only: a member of the project's organization, not the one sharing. */
    private UUID sharedWithUserId;
    /** The version to show; null shows the latest. */
    private Integer version;
    /** When the share stops on its own; null for no end. */
    private Instant expiresAt;
}