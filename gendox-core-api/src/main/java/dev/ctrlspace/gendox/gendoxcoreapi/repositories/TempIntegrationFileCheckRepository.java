package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TempIntegrationFileCheck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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
            SELECT DISTINCT temp.*
                FROM gendox_core.temp_integration_file_checks temp
                         LEFT JOIN (SELECT pd.project_id, di.content_id
                                    FROM gendox_core.project_documents pd
                                             INNER JOIN gendox_core.document_instance di
                                                        ON di.id = pd.document_id) AS doc
                                   ON temp.project_id = doc.project_id
                                       AND temp.content_id = doc.content_id
                WHERE temp.integration_id = :integrationId
                  AND temp.trace_id = :traceId
                  AND doc.content_id IS NULL;
            """)
    List<TempIntegrationFileCheck> findDocsToCreateByIntegrationId(@Param("integrationId") UUID integrationId,
                                                                   @Param("traceId") String traceId);

    /**
     * Finds content IDs to update where TempIntegrationFileCheck.updated_at is more recent than DocumentInstance.updated_at.
     */
    @Query(nativeQuery = true, value = """
                SELECT distinct temp.*
                    FROM gendox_core.temp_integration_file_checks temp
                             INNER JOIN (SELECT pd.project_id, di.content_id, di.updated_at
                                         FROM gendox_core.project_documents pd
                                                  INNER JOIN gendox_core.document_instance di
                                                             ON di.id = pd.document_id) AS doc
                                        ON temp.project_id = doc.project_id
                                            AND temp.content_id = doc.content_id
                    WHERE temp.integration_id = :integrationId
                      AND temp.trace_id = :traceId
                      AND temp.updated_at > doc.updated_at;
            """)
    List<TempIntegrationFileCheck> findDocsToUpdate(@Param("integrationId") UUID integrationId,
                                                    @Param("traceId") String traceId);


    /**
     * Finds DocumentInstance IDs (UUID) to delete based on the absence of corresponding content_id in TempIntegrationFileCheck
     * and filters by the given organizationId.
     */
    @Query(nativeQuery = true, value = """
            SELECT distinct di.id, di.title
            FROM gendox_core.project_documents pd
                INNER JOIN gendox_core.document_instance di
                    ON di.id = pd.document_id
                LEFT JOIN gendox_core.temp_integration_file_checks temp
                    on temp.project_id = pd.project_id
                        AND temp.content_id = di.content_id
                        and temp.integration_id = :integrationId
            WHERE di.organization_id = :organizationId
              and temp.id is null;
            """)
    List<UUID> findDocsToDeleteByOrganizationId(@Param("integrationId") UUID integrationId,
                                                @Param("organizationId") UUID organizationId);




    /**
     * Deletes all TempIntegrationFileCheck entities by integrationId.
     */
    @Query(nativeQuery = true, value = """
            DELETE
            FROM gendox_core.temp_integration_file_checks
            WHERE integration_id = :integrationId;
            """)
    @Modifying
    void deleteAllByIntegrationId(@Param("integrationId") UUID integrationId);


}
