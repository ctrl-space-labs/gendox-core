package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ArtifactRepository extends JpaRepository<Artifact, UUID> {

    List<Artifact> findAllByThreadIdOrderByCreatedAtAsc(UUID threadId);

    Optional<Artifact> findByIdAndThreadId(UUID id, UUID threadId);

    /** Locks the row until the transaction ends, so two updates of one artifact number their versions one after the other. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Artifact a where a.id = :id and a.threadId = :threadId")
    Optional<Artifact> lockByIdAndThreadId(@Param("id") UUID id, @Param("threadId") UUID threadId);
}