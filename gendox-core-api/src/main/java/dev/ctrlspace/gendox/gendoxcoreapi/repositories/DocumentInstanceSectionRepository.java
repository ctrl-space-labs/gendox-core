package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
public interface DocumentInstanceSectionRepository extends JpaRepository<DocumentInstanceSection, UUID> , QuerydslPredicateExecutor<DocumentInstanceSection> {

    @EntityGraph(attributePaths = {"documentSectionMetadata", "documentInstance"})
    Page<DocumentInstanceSection> findAll(Predicate predicate, Pageable pageable);

    @EntityGraph(attributePaths = {"documentSectionMetadata", "documentInstance"})
    @Query("SELECT dis FROM DocumentInstanceSection dis WHERE dis.documentInstance.id = :documentInstanceId")
    public List<DocumentInstanceSection> findByDocumentInstance(UUID documentInstanceId);

    @Query("SELECT dis FROM DocumentInstanceSection dis " +
            "INNER JOIN ProjectDocument pd ON dis.documentInstance.id = pd.documentId " +
            "WHERE pd.project.id = :projectId")
    public List<DocumentInstanceSection> findByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT dis FROM DocumentInstanceSection dis " +
            "INNER JOIN EmbeddingGroup eg ON dis.id = eg.sectionId " + // Adjust the join condition as needed
            "WHERE eg.embeddingId IN :embeddingIds")
    public List<DocumentInstanceSection> findByEmbeddingIds(Set<UUID> embeddingIds);

    @Query("SELECT dis FROM DocumentInstanceSection dis " +
            "INNER JOIN ProjectDocument pd ON dis.documentInstance.id = pd.documentId " +
            "LEFT JOIN FETCH dis.documentSectionMetadata dsm " +
            "WHERE pd.project.id = :projectId AND dis.id IN :sectionIds")
    public List<DocumentInstanceSection> findByProjectAndSectionIds(UUID projectId, Set<UUID> sectionIds);

    // Method to count the DocumentInstanceSections associated with the DocumentInstance IDs from the Page<DocumentInstance>
    @Query("SELECT COUNT(dis) FROM DocumentInstanceSection dis WHERE dis.documentInstance.id IN :documentInstanceIds")
    long countByDocumentInstanceIds(@Param("documentInstanceIds") Set<UUID> documentInstanceIds);

    // Deletes all sections for the doc, then deletes ONLY metadata no longer referenced by any section
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            WITH del_sections AS (
              DELETE FROM gendox_core.document_instance_sections s
              WHERE s.document_instance_id = :documentId
              RETURNING s.document_section_metadata_id
            ),
            orphans AS (
              SELECT DISTINCT d.document_section_metadata_id
              FROM del_sections d
              WHERE d.document_section_metadata_id IS NOT NULL
                AND NOT EXISTS (
                  SELECT 1
                  FROM gendox_core.document_instance_sections s2
                  WHERE s2.document_section_metadata_id = d.document_section_metadata_id
                )
            )
            DELETE FROM gendox_core.document_section_metadata m
            USING orphans o
            WHERE m.id = o.document_section_metadata_id
            """, nativeQuery = true)
    int deleteSectionsAndOrphanMetadata(@Param("documentId") UUID documentId);



}
