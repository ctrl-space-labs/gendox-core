package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ArtifactDataRepository extends JpaRepository<ArtifactData, UUID> {

    /** One shared document. */
    Optional<ArtifactData> findByArtifactIdAndCollectionAndDocIdAndPrivateToIsNull(UUID artifactId, String collection,
                                                                                    String docId);

    /** One person's private document. */
    Optional<ArtifactData> findByArtifactIdAndCollectionAndDocIdAndPrivateTo(UUID artifactId, String collection,
                                                                              String docId, UUID privateTo);

    /** What one person reads of a collection: its shared documents and their own private ones, the last changed last. */
    @Query("""
            SELECT d FROM ArtifactData d
            WHERE d.artifactId = :artifactId AND d.collection = :collection
              AND (d.privateTo IS NULL OR d.privateTo = :userId)
            ORDER BY d.updatedAt ASC, d.createdAt ASC
            """)
    List<ArtifactData> findVisible(@Param("artifactId") UUID artifactId, @Param("collection") String collection,
                                   @Param("userId") UUID userId);

    /** The shared documents of a collection, the last changed last: what the agent reads. */
    List<ArtifactData> findAllByArtifactIdAndCollectionAndPrivateToIsNullOrderByUpdatedAtAscCreatedAtAsc(UUID artifactId,
                                                                                                         String collection);

    /** The shared documents of an artifact: what its Contributors wrote, counted against its own limit. */
    /**
     * Deletes a document only while it still has the revision it was read at, in one statement: 0 when another wrote
     * it, or deleted it, since.
     */
    @Modifying
    @Query("DELETE FROM ArtifactData d WHERE d.id = :id AND d.revision = :revision")
    int deleteAtRevision(@Param("id") UUID id, @Param("revision") Integer revision);

    /**
     * Holds, until the transaction ends, the lock of one room of documents (an artifact's shared ones, or one person's
     * private ones in it), so that counting it and adding to it are one step for everyone who writes there.
     */
    @Query(value = "SELECT 1 FROM (SELECT pg_advisory_xact_lock(hashtextextended(:room, 0))) AS locked", nativeQuery = true)
    Integer lockRoom(@Param("room") String room);

    long countByArtifactIdAndPrivateToIsNull(UUID artifactId);

    /** One person's private documents of an artifact, counted against their own limit. */
    long countByArtifactIdAndPrivateTo(UUID artifactId, UUID privateTo);
}
