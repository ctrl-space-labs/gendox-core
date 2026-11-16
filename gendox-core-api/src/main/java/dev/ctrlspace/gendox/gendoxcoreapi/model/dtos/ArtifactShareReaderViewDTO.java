package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * A shared artifact as someone it was shared with sees it: never its conversation (no thread, no messages, no other
 * versions, no one but who shared it). The content only when one share is opened; null in a list of shares.
 * The owner's side is {@link ArtifactShareOwnerViewDTO}.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ArtifactShareReaderViewDTO {
    private UUID shareId;
    /** PROJECT or USER: shared with everyone in the agent, or with this reader alone. */
    private String audience;
    private String title;
    private Type artifactType;
    private String codeLanguage;
    /** The agent the artifact was made with; its members may continue from it in a chat of their own. */
    private UUID projectId;
    private UUID organizationId;
    private String sharedByName;
    private Instant sharedAt;
    private Instant expiresAt;
    /** The version below: the shared one, or the latest when the share follows the latest. */
    private Integer version;
    /** True when the share follows the latest version. */
    private Boolean followsLatest;
    /** Last changed: the artifact's change for a share that follows the latest, the version's date otherwise. */
    private Instant updatedAt;
    private String content;
}