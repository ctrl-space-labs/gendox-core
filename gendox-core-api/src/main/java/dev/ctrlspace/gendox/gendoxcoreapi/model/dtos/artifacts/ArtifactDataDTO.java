package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tools.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.UUID;

/**
 * One document of an artifact's data (gendox-core#600), as the artifact reads it. The data was written by users: it is
 * only ever shown as text. Who wrote it is a user id; names come from the host, never from the data.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ArtifactDataDTO {
    private String collection;
    private String docId;
    private JsonNode data;
    /** The reader's own document, rather than a shared one. */
    @JsonProperty("private")
    private boolean privateDocument;
    private Integer revision;
    private UUID updatedBy;
    private Instant updatedAt;
}
