package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ArtifactRepository extends JpaRepository<Artifact, UUID>, QuerydslPredicateExecutor<Artifact> {

    List<Artifact> findAllByThreadIdOrderByCreatedAtAsc(UUID threadId);

    /**
     * Locks the row until the transaction ends, so two updates of one artifact number their versions one after the other.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Artifact a where a.id = :id")
    Optional<Artifact> lockById(@Param("id") UUID id);
}