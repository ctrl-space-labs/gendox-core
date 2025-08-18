package dev.ctrlspace.gendox.spring.batch.backfill;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Runs the backfill job automatically when the application starts.
 * Only runs if the backfill trigger marker exists in system_configuration.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "gendox.batch-jobs.backfill.pages.auto-after-migrate", havingValue = "true", matchIfMissing = false)
public class FlywayAfterMigrateConfig {

    private final BackfillPagesService backfill;
    private final JdbcTemplate jdbcTemplate;

    public FlywayAfterMigrateConfig(BackfillPagesService backfill, JdbcTemplate jdbcTemplate) {
        this.backfill = backfill;
        this.jdbcTemplate = jdbcTemplate;
        log.info("FlywayAfterMigrateConfig created - will check for backfill trigger before running");
    }

    @EventListener(ApplicationReadyEvent.class)
    public void runBackfillAfterStartup() {
        log.info("=== BACKFILL CHECK STARTED ===");
        log.info("Application started. Checking for backfill trigger marker...");
        
        // Debug info
        try {
            String configValue = System.getProperty("gendox.batch-jobs.backfill.pages.auto-after-migrate", "NOT_SET");
            log.info("System property gendox.batch-jobs.backfill.pages.auto-after-migrate = {}", configValue);
        } catch (Exception e) {
            log.warn("Could not read system property: {}", e.getMessage());
        }
        
        if (hasBackfillTrigger()) {
            log.info("*** BACKFILL TRIGGER FOUND! Running automatic pages backfill... ***");
            try {
                backfill.runBackfill();
                log.info("*** Automatic pages backfill completed successfully. ***");
            } catch (Exception e) {
                log.error("Pages backfill failed after application startup. Some documents may have null page counts.", e);
                // Don't throw - let the application continue
            }
        } else {
            log.info("*** NO BACKFILL TRIGGER FOUND. Skipping automatic backfill. ***");
        }
        log.info("=== BACKFILL CHECK ENDED ===");
    }

    private boolean hasBackfillTrigger() {
        log.info("Checking for backfill trigger in index comment...");
        try {
            // First check if index exists
            String indexCheckSql = "SELECT COUNT(*) FROM pg_class WHERE relname = 'idx_document_instance_pages_null'";
            Integer indexCount = jdbcTemplate.queryForObject(indexCheckSql, Integer.class);
            log.info("Index idx_document_instance_pages_null exists: {} (count={})", indexCount > 0, indexCount);
            
            // Then check for trigger in comment
            String sql = """
                SELECT COUNT(*) 
                FROM pg_description d
                JOIN pg_class c ON d.objoid = c.oid
                WHERE c.relname = 'idx_document_instance_pages_null'
                AND d.description LIKE 'BACKFILL_TRIGGER_%'
                """;
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class);
            log.info("Trigger comment check result: count = {}", count);
            
            // Also get the actual comment to debug
            String commentSql = """
                SELECT d.description 
                FROM pg_description d
                JOIN pg_class c ON d.objoid = c.oid
                WHERE c.relname = 'idx_document_instance_pages_null'
                """;
            try {
                String comment = jdbcTemplate.queryForObject(commentSql, String.class);
                log.info("Index comment: '{}'", comment);
            } catch (Exception ex) {
                log.info("No comment found for index");
            }
            
            boolean hasTrigger = count != null && count > 0;
            log.info("Final trigger result: {}", hasTrigger);
            return hasTrigger;
        } catch (Exception e) {
            log.error("Could not check index comment for backfill trigger: {}", e.getMessage(), e);
            return false;
        }
    }
}