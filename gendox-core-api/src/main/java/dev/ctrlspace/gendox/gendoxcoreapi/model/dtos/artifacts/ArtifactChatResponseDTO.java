package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * The conversation Change it in a chat started, for the page to open.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ArtifactChatResponseDTO {
    private UUID threadId;
}