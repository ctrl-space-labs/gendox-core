package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.TempIntegrationFileCheck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TempIntegrationFileCheckRepository extends JpaRepository<TempIntegrationFileCheck, UUID>, QuerydslPredicateExecutor<TempIntegrationFileCheck> {

    /**
     * Finds content IDs to create based on the absence of corresponding content_id in DocumentInstance.
     */
    @Query(nativeQuery = true, value = """
            SELECT temp.*
            FROM gendox_core.temp_integration_file_checks temp
                     LEFT JOIN gendox_core.document_instance di ON di.content_id = temp.content_id
            WHERE di.content_id IS NULL and temp.integration_id = :integrationId
            """)
    List<TempIntegrationFileCheck> findDocsToCreateByIntegrationId(UUID integrationId);

    /**
     * Finds content IDs to update where TempIntegrationFileCheck.updated_at is more recent than DocumentInstance.updated_at.
     */
    @Query(nativeQuery = true, value = """
            SELECT temp.*
            FROM gendox_core.document_instance di
                     INNER JOIN gendox_core.temp_integration_file_checks temp ON di.content_id = temp.content_id
            WHERE temp.updated_at > di.updated_at and temp.integration_id = :integrationId
            """)
    List<TempIntegrationFileCheck> findDocsToUpdate(UUID integrationId);


    /**
     * Finds DocumentInstance IDs (UUID) to delete based on the absence of corresponding content_id in TempIntegrationFileCheck
     * and filters by the given organizationId.
     */
    @Query(nativeQuery = true, value = """
            SELECT di.id AS docs_to_delete_id
            FROM gendox_core.document_instance di
                     LEFT JOIN gendox_core.temp_integration_file_checks temp ON di.content_id = temp.content_id
            WHERE temp.content_id IS NULL
              AND di.organization_id = :organizationId and temp.integration_id = :integrationId
            """)
    List<UUID> findDocsToDeleteByOrganizationId(@Param("integrationId") UUID integrationId, @Param("organizationId") UUID organizationId);


}
