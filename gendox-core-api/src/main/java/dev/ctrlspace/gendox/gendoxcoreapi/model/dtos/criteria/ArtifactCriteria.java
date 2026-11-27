package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * What a list of artifacts is narrowed to. {@code projectId} and {@code memberId} are always set by the server, from
 * the path and from the signed-in user, never taken from the request: they are what keeps a list to the user's own
 * conversations.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ArtifactCriteria {
    private UUID projectId;
    // the signed-in user, always set by the controller
    private UUID userId;
    // false or null: the user's own artifacts; true: the others' artifacts the user has a role on
    private Boolean sharedWithMe;
    // free text over the title
    private String search;
    // a name of category ARTIFACT_TYPE, in any case: HTML, SVG, MARKDOWN, CODE
    private String artifactType;
}