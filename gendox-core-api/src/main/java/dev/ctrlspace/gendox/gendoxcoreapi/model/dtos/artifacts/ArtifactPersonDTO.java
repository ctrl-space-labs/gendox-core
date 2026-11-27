package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * A member of an artifact's agent as the artifact's own code may know them (gendox-core#600): an id and a name, never
 * an email.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ArtifactPersonDTO {
    private UUID userId;
    private String name;
}
