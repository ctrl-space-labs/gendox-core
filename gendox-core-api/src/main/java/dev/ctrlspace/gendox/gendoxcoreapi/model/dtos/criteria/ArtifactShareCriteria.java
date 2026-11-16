package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * What a list of the artifacts shared with one reader ("Shared with you") is narrowed to. Everything but
 * {@code search} and {@code artifactType} is set by the server, from the path, the signed-in user and the clock,
 * never taken from the request: it is what keeps the list to the shares this reader may open.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ArtifactShareCriteria {
    // the signed-in user the shares were made to: by name (USER), or through a project they are a member of (PROJECT)
    private UUID readerId;
    // the organization the list is in
    private UUID organizationId;
    // the projects of that organization the reader is a member of; PROJECT shares count only in these
    private List<UUID> readerProjectIds;
    // one agent's list; null for the organization's
    private UUID projectId;
    // a share counts while it is not revoked and not past its end at this moment
    private Instant activeAt;
    // free text over the artifact's title
    private String search;
    // a name of category ARTIFACT_TYPE, in any case: HTML, SVG, MARKDOWN, CODE
    private String artifactType;
}