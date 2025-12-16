package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationDailyUsage;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DailyUsageAggregationResultDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Date;


import java.util.UUID;

@Repository
public interface OrganizationDailyUsageRepository extends JpaRepository<OrganizationDailyUsage, UUID>, QuerydslPredicateExecutor<OrganizationDailyUsage> {

    @Query("SELECT SUM(o.messages) FROM OrganizationDailyUsage o " +
            "WHERE o.organizationId = :organizationId " +
            "AND o.date BETWEEN :startDate AND :endDate")
    Long sumMessagesByOrganizationIdAndDateBetween(@Param("organizationId") UUID organizationId,
                                                   @Param("startDate") Date startDate,
                                                   @Param("endDate") Date endDate);


    @Query("SELECT SUM(o.storageMb) FROM OrganizationDailyUsage o " +
            "WHERE o.organizationId = :organizationId " +
            "AND o.date BETWEEN :startDate AND :endDate")
    Long sumStorageMbByOrganizationIdAndDateBetween(@Param("organizationId") UUID organizationId,
                                                    @Param("startDate") Date startDate,
                                                    @Param("endDate") Date endDate);

    @Query("SELECT SUM(o.documentUploads) FROM OrganizationDailyUsage o " +
            "WHERE o.organizationId = :organizationId " +
            "AND o.date BETWEEN :startDate AND :endDate")
    Long sumDocumentUploadsByOrganizationIdAndDateBetween(@Param("organizationId") UUID organizationId,
                                                          @Param("startDate") Date startDate,
                                                          @Param("endDate") Date endDate);


    @Query(value = """
    WITH batch AS (
      SELECT id, audit_log_id
      FROM gendox_core.audit_log_queue
      ORDER BY id
      LIMIT :batchSize
      FOR UPDATE SKIP LOCKED
    ),
    logs AS (
      SELECT al.*
      FROM batch b
      JOIN gendox_core.audit_logs al ON al.id = b.audit_log_id
    ),
    agg AS (
      SELECT
        al.organization_id,
        COALESCE(al.created_at::date, now()::date) AS date_key,
        SUM(CASE WHEN al.type_id = (SELECT id FROM gendox_core.types WHERE type_category='AUDIT_LOG_TYPE' AND name='COMPLETION_RESPONSE') THEN 1 ELSE 0 END) AS messages,
        SUM(CASE WHEN al.type_id = (SELECT id FROM gendox_core.types WHERE type_category='AUDIT_LOG_TYPE' AND name='DOCUMENT_CREATE') THEN 1
                 WHEN al.type_id = (SELECT id FROM gendox_core.types WHERE type_category='AUDIT_LOG_TYPE' AND name='DOCUMENT_DELETE') THEN -1
                 ELSE 0 END) AS document_uploads,
        SUM(CASE WHEN al.type_id = (SELECT id FROM gendox_core.types WHERE type_category='AUDIT_LOG_TYPE' AND name='CREATE_DOCUMENT_SECTIONS') THEN COALESCE(al.audit_value,1) ELSE 0 END) AS document_sections,
        COALESCE(SUM(CASE
          WHEN al.type_id = (SELECT id FROM gendox_core.types WHERE type_category='AUDIT_LOG_TYPE' AND name='DOCUMENT_CREATE') THEN COALESCE(al.audit_value,0)
          WHEN al.type_id = (SELECT id FROM gendox_core.types WHERE type_category='AUDIT_LOG_TYPE' AND name='DOCUMENT_DELETE') THEN -COALESCE(al.audit_value,0)
          ELSE 0 END),0) AS storage_mb
      FROM logs al
      GROUP BY al.organization_id, date_key
    ),
    upsert AS (
      INSERT INTO gendox_core.organization_daily_usage
        (organization_id, date, messages, document_uploads, document_sections, storage_mb)
      SELECT organization_id, date_key, messages, document_uploads, document_sections, storage_mb
      FROM agg
      ORDER BY organization_id, date_key
      ON CONFLICT (organization_id, date) DO UPDATE
        SET messages          = gendox_core.organization_daily_usage.messages + EXCLUDED.messages,
            document_uploads  = gendox_core.organization_daily_usage.document_uploads + EXCLUDED.document_uploads,
            document_sections = gendox_core.organization_daily_usage.document_sections + EXCLUDED.document_sections,
            storage_mb        = gendox_core.organization_daily_usage.storage_mb + EXCLUDED.storage_mb
      RETURNING 1
    ),
    del AS (
      DELETE FROM gendox_core.audit_log_queue q
      USING batch b
      WHERE q.id = b.id
      RETURNING 1
    )
    SELECT
      (SELECT COUNT(*) FROM batch)  AS taken,
      (SELECT COUNT(*) FROM upsert) AS upserts,
      (SELECT COUNT(*) FROM del)    AS deleted
    """, nativeQuery = true)
    DailyUsageAggregationResultDTO aggregateDailyUsage(@Param("batchSize") int batchSize);
}
