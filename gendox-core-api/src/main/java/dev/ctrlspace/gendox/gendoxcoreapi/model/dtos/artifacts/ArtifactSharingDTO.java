package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Who may open an artifact, as its share dialog shows it: the owner, the people invited one by one, the general
 * access of every member of the agent, and the public link. Only the owner changes them.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ArtifactSharingDTO {

    private UUID artifactId;

    /** The signed-in user's role: VIEW, INTERACT, EDIT or OWNER. The dialog offers changes to OWNER only. */
    private String yourRole;

    private Person owner;

    /** People with access after the owner, the first invited first. */
    private List<Person> members;

    /** VIEW, INTERACT or EDIT for every member of the agent; null for only the owner and the people invited. */
    private String generalAccessRole;

    /** The id in the public link, /a/{publicId}; null while it is not public. */
    private UUID publicId;

    private Instant publicAt;

    /** One person with access, named for the dialog; the artifact itself keeps only the id. */
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder(toBuilder = true)
    public static class Person {
        private UUID userId;
        private String name;
        private String email;
        /** VIEW, INTERACT or EDIT; null for the owner. */
        private String role;
    }
}