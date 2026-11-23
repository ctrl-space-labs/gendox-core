package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactThread;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ArtifactThreadRepository extends JpaRepository<ArtifactThread, UUID> {

    /** The artifacts a conversation was opened on, besides its own: what the agent is told about on each turn. */
    List<ArtifactThread> findAllByThreadId(UUID threadId);

    /** Whether a conversation was opened on this artifact: the tools reach it only then. */
    boolean existsByArtifactIdAndThreadId(UUID artifactId, UUID threadId);
}