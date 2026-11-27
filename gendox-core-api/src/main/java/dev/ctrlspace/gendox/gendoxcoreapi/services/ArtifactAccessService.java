package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactMemberRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectMemberRepository;
import org.springframework.http.HttpStatus;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;

/**
 * The one place that decides what a user may do with an artifact, so the rule can later become a call to the core
 * when artifacts move to a service of their own. A user's role is the higher of the artifact's general access and
 * their own invitation; the owner may do everything. Nobody outside the artifact's agent has a role, the owner
 * included: someone who leaves the agent loses its artifacts.
 */
@Service
public class ArtifactAccessService {

    /** In rising order: each role may do all that the ones before it may. */
    public enum Role {
        VIEW, INTERACT, EDIT, OWNER;

        public boolean atLeast(Role other) {
            return compareTo(other) >= 0;
        }
    }

    private final ArtifactMemberRepository artifactMemberRepository;
    private final ProjectMemberRepository projectMemberRepository;

    public ArtifactAccessService(ArtifactMemberRepository artifactMemberRepository,
                                 ProjectMemberRepository projectMemberRepository) {
        this.artifactMemberRepository = artifactMemberRepository;
        this.projectMemberRepository = projectMemberRepository;
    }

    /**
     * The user's role on the artifact; empty when they may not see it at all. Only a current member of an agent and an
     * organization that are both active has one: a deleted one lets no one in, whatever was left behind.
     */
    public Optional<Role> roleOf(Artifact artifact, @Nullable UUID userId) {
        if (userId == null || !projectMemberRepository.existsActiveMembership(artifact.getProjectId(), userId)) {
            return Optional.empty();
        }
        if (userId.equals(artifact.getOwnerId())) {
            return Optional.of(Role.OWNER);
        }
        Role general = roleNamed(artifact.getGeneralAccessRole());
        Role invited = artifactMemberRepository.findByArtifactIdAndUserId(artifact.getId(), userId)
                .map(member -> roleNamed(member.getRole()))
                .orElse(null);
        return Stream.of(general, invited)
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder());
    }

    /**
     * The user's role, when it is at least {@code needed}. Someone who may not see the artifact is told it does not
     * exist, as for an id that was never there; someone who sees it with a lower role is told which role it needs.
     */
    public Role require(Artifact artifact, @Nullable UUID userId, Role needed) throws GendoxException {
        Role role = roleOf(artifact, userId)
                .orElseThrow(() -> new GendoxException("ARTIFACT_NOT_FOUND",
                        "No artifact " + artifact.getId() + " that you can open", HttpStatus.NOT_FOUND));
        if (!role.atLeast(needed)) {
            throw new GendoxException("ARTIFACT_ROLE_TOO_LOW",
                    "Your role on artifact " + artifact.getId() + " is " + role + "; this needs " + needed,
                    HttpStatus.FORBIDDEN);
        }
        return role;
    }

    @Nullable
    private static Role roleNamed(@Nullable Type type) {
        return type == null ? null : Role.valueOf(type.getName());
    }
}