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




    @Modifying
    @Query(nativeQuery = true, value = "DELETE FROM gendox_core.document_instance WHERE id IN :documentIds")
    void deleteAllByIds(@Param("documentIds") List<UUID> documentIds);


}

