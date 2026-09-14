package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentInstanceRepository extends JpaRepository<DocumentInstance, UUID> , QuerydslPredicateExecutor<DocumentInstance> {

    @Query(nativeQuery = true, value = "SELECT * FROM gendox_core.document_instance di WHERE di.id = :id")
    Optional<DocumentInstance> findDocumentInstanceById(@Param("id") UUID id);

    @Query(nativeQuery = true, value = "SELECT di.remote_url FROM gendox_core.document_instance di " +
            "INNER JOIN gendox_core.document_instance_sections dis on di.id = dis.document_instance_id " +
            "WHERE dis.id = :sectionId")
    String findRemoteUrlBySectionId(@Param("sectionId") UUID sectionId);

    Optional<DocumentInstance> findByOrganizationIdAndRemoteUrl(UUID organizationId, String remoteUrl);


    @Query(nativeQuery = true, value = "SELECT di.* " +
            "FROM gendox_core.document_instance di " +
            "INNER JOIN gendox_core.project_documents pd ON di.id = pd.document_id " +
            "WHERE di.organization_id = :organizationId " +
            "AND pd.project_id = :projectId " +
            "AND RIGHT(di.remote_url, CHAR_LENGTH(:fileName)) = :fileName " +
            "ORDER BY di.updated_at DESC " +
            "LIMIT 1")
    Optional<DocumentInstance> findByProjectIdAndOrganizationIdAndFileName(
            @Param("projectId") UUID projectId,
            @Param("organizationId") UUID organizationId,
            @Param("fileName") String fileName);


    @Query(nativeQuery = true, value = "SELECT di.* " +
            "FROM gendox_core.document_instance di " +
            "INNER JOIN gendox_core.project_documents pd ON di.id = pd.document_id " +
            "WHERE di.organization_id = :organizationId " +
            "AND pd.project_id = :projectId " +
            "AND di.title = :title " +
            "ORDER BY di.updated_at DESC " +
            "LIMIT 1")
    Optional<DocumentInstance> findByProjectIdAndOrganizationIdAndTitle(
            @Param("projectId") UUID projectId,
            @Param("organizationId") UUID organizationId,
            @Param("title") String title);




    @Query(nativeQuery = true, value = "SELECT CASE WHEN COUNT(di.id) > 0 THEN TRUE ELSE FALSE END " +
            "FROM gendox_core.document_instance di " +
            "INNER JOIN gendox_core.project_documents pd ON di.id = pd.document_id " +
            "WHERE di.id = :documentId AND pd.project_id IN (:projectIds)")
    boolean existsByDocumentIdAndProjectIds(@Param("documentId") UUID documentId, @Param("projectIds") List<UUID> projectIds);

    @Query(value = """
                SELECT (COUNT(DISTINCT pd.document_id) = cardinality(CAST(:documentIds AS uuid[]))) AS all_belong
                FROM gendox_core.project_documents pd
                WHERE pd.document_id = ANY(CAST(:documentIds AS uuid[]))
                  AND pd.project_id  = ANY(CAST(:projectIds  AS uuid[]))
            """, nativeQuery = true)
    boolean areAllDocumentIdsInAnyProject(@Param("documentIds") UUID[] documentIds, @Param("projectIds")  UUID[] projectIds);


    @Modifying
    @Query(nativeQuery = true, value = "DELETE FROM gendox_core.document_instance WHERE id IN :documentIds")
    void deleteAllByIds(@Param("documentIds") List<UUID> documentIds);

    /**
     * Total number of document pages currently stored by an organization.
     * Documents uploaded as chat attachments are excluded, they are not knowledge base content.
     * A document with an unknown page count (e.g. plain text files, or a failed page count) counts as one page.
     */
    @Query(nativeQuery = true, value = "SELECT COALESCE(SUM(COALESCE(di.number_of_pages, 1)), 0) " +
            "FROM gendox_core.document_instance di " +
            "WHERE di.organization_id = :organizationId " +
            "AND NOT EXISTS (SELECT 1 FROM gendox_core.chat_thread_documents ctd WHERE ctd.document_id = di.id)")
    Long sumNumberOfPagesByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("select d.organizationId from DocumentInstance d where d.id = :documentId")
    UUID findOrganizationIdByDocumentId(@Param("documentId") UUID documentId);

    @Query("select case when count(d) > 0 then true else false end from DocumentInstance d where d.id = :documentId and d.createdBy = :userId")
    boolean existsByIdAndCreatedBy(@Param("documentId") UUID documentId, @Param("userId") UUID userId);


}

