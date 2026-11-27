package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * An artifact as anyone with its public link sees it, signed in or not: the artifact and the agent that made it.
 * Never its conversation, its organization, its other versions, or who made it.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class PublicArtifactDTO {
    private UUID publicId;
    private String title;
    private Type artifactType;
    private String codeLanguage;
    private Integer version;
    private String content;
    private String agentName;
}