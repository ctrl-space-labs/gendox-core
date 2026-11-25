package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactData;
import org.springframework.data.jpa.repository.JpaRepository;
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

    long countByArtifactId(UUID artifactId);
}
