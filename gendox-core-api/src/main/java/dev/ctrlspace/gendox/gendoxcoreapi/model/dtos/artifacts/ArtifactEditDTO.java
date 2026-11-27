package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One replacement in an artifact, as update_artifact receives it: {@code oldText} must occur
 * exactly once in the content, and {@code newText} takes its place (empty to delete it).
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ArtifactEditDTO {
    @JsonProperty("old_text")
    private String oldText;

    @JsonProperty("new_text")
    private String newText;
}