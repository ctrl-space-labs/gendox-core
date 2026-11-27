package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A role to give on an artifact: VIEW, INTERACT or EDIT, in any case. For general access, null leaves the artifact to
 * its owner and the people invited.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ArtifactRoleRequestDTO {
    private String role;
}