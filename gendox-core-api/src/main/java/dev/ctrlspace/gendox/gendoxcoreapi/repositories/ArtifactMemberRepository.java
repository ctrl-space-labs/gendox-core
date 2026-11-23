package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ArtifactMemberRepository extends JpaRepository<ArtifactMember, UUID> {

    /** The people invited to an artifact, the first invited first: its "People with access" after the owner. */
    List<ArtifactMember> findAllByArtifactIdOrderByCreatedAtAsc(UUID artifactId);

    /** One person's invitation, which gives their own role. */
    Optional<ArtifactMember> findByArtifactIdAndUserId(UUID artifactId, UUID userId);
}