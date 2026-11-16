package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * One active share of an artifact, as its owner sees it in the artifact: who sees it, which version, until when.
 * The reader's side is {@link ArtifactShareReaderViewDTO}.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ArtifactShareOwnerViewDTO {
    private UUID id;
    /** PROJECT or USER. */
    private String audience;
    private UUID sharedWithUserId;
    private String sharedWithName;
    private String sharedWithEmail;
    /** Null: the latest. */
    private Integer version;
    private Instant expiresAt;
    private Instant createdAt;
    private UUID createdBy;
}