-- Create partial index to speed up backfill queries (or update if exists)
DROP INDEX IF EXISTS gendox_core.idx_document_instance_pages_null;
CREATE INDEX idx_document_instance_pages_null
    ON gendox_core.document_instance (id)
    WHERE number_of_pages IS NULL;

-- Add special comment as trigger marker for automatic backfill execution
-- This will be checked by FlywayAfterMigrateConfig to determine if backfill should run
COMMENT ON INDEX gendox_core.idx_document_instance_pages_null IS 
    'BACKFILL_TRIGGER_V20250918_115401: Optimizes queries for document instances requiring page count backfill';