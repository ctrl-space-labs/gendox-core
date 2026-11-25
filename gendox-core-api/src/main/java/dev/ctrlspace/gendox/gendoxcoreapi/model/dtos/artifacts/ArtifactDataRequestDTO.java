package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tools.jackson.databind.JsonNode;

/**
 * A document to write into an artifact's data (gendox-core#600): the whole document, or for an update only the fields
 * to change.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ArtifactDataRequestDTO {
    private JsonNode data;
    /** The writer's own document, which only they read; a shared one when false or left out. */
    @JsonProperty("private")
    private Boolean privateDocument;

    public boolean wantsPrivate() {
        return Boolean.TRUE.equals(privateDocument);
    }
    /** The revision last read: a document changed since is not overwritten. Null for any; 0 for a new one only. */
    private Integer revision;
}
