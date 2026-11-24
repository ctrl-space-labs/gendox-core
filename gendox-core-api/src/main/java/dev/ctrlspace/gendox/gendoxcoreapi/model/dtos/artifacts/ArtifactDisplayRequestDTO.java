package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * How an artifact shows in the answer: CARD or INLINE, in any case.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ArtifactDisplayRequestDTO {
    private String display;
}