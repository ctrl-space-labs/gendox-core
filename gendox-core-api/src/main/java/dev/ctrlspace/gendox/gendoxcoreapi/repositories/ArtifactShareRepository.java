package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ArtifactShareRepository extends JpaRepository<ArtifactShare, UUID>, QuerydslPredicateExecutor<ArtifactShare> {

    /** The artifact's shares not revoked, oldest first; one that has passed its end is among them until it is revoked. */
    List<ArtifactShare> findAllByArtifact_IdAndRevokedAtIsNullOrderByCreatedAtAsc(UUID artifactId);

    /** The artifact's share for its whole project that is not revoked, if any. */
    Optional<ArtifactShare> findByArtifact_IdAndSharedWithUserIdIsNullAndRevokedAtIsNull(UUID artifactId);

    /** The artifact's share with one user that is not revoked, if any. */
    Optional<ArtifactShare> findByArtifact_IdAndSharedWithUserIdAndRevokedAtIsNull(UUID artifactId, UUID sharedWithUserId);
}