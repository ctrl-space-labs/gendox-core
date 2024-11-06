-- Create the organization_daily_usage table
CREATE TABLE IF NOT EXISTS gendox_core.organization_daily_usage
(
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES gendox_core.organizations (id),
    date                DATE NOT NULL,
    messages            BIGINT DEFAULT 0,
    active_users        BIGINT DEFAULT 0,
    document_uploads    BIGINT DEFAULT 0,
    document_sections   BIGINT DEFAULT 0,
    storage_mb          BIGINT DEFAULT 0,
    number_integrations BIGINT DEFAULT 0
);

-- Add audit_value column to audit_logs if it doesn't exist
ALTER TABLE gendox_core.audit_logs
    ADD COLUMN IF NOT EXISTS audit_value BIGINT;
COMMENT ON COLUMN gendox_core.audit_logs.audit_value IS 'This column will be used to store the value of the audit log.';

-- Insert type 'CREATE_DOCUMENT_SECTIONS' if it doesn't exist
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AUDIT_LOG_TYPE', 'CREATE_DOCUMENT_SECTIONS', 'New Document Sections Created'
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'AUDIT_LOG_TYPE' AND name = 'CREATE_DOCUMENT_SECTIONS'
);

-- Unique index for upsert operations
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_daily_usage_org_date
    ON gendox_core.organization_daily_usage (organization_id, date);

-- Index to optimize queries by organization_id
CREATE INDEX IF NOT EXISTS idx_org_daily_usage_org
    ON gendox_core.organization_daily_usage (organization_id);

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION gendox_core.update_organization_daily_usage()
    RETURNS TRIGGER AS $$
DECLARE
    completion_response_type_id bigint;
    document_upload_type_id bigint;
    document_sections_type_id bigint;
BEGIN
    RAISE NOTICE 'NEW.organization_id: %', NEW.organization_id;
    RAISE NOTICE 'NEW.created_at: %', NEW.created_at;

    -- Fetch type IDs for relevant types
    SELECT id INTO completion_response_type_id
    FROM gendox_core.types
    WHERE type_category = 'AUDIT_LOG_TYPE'
      AND name = 'COMPLETION_RESPONSE';

    SELECT id INTO document_upload_type_id
    FROM gendox_core.types
    WHERE type_category = 'AUDIT_LOG_TYPE'
      AND name = 'DOCUMENT_CREATE';

    SELECT id INTO document_sections_type_id
    FROM gendox_core.types
    WHERE type_category = 'AUDIT_LOG_TYPE'
      AND name = 'CREATE_DOCUMENT_SECTIONS';

    -- Check for 'COMPLETION_RESPONSE' type
    IF NEW.type_id = completion_response_type_id THEN
        INSERT INTO gendox_core.organization_daily_usage (organization_id, date, messages)
        VALUES (NEW.organization_id, NEW.created_at::date, 1)
        ON CONFLICT (organization_id, date)
            DO UPDATE SET messages = gendox_core.organization_daily_usage.messages + EXCLUDED.messages;

        -- Check for 'DOCUMENT_CREATE' type
    ELSIF NEW.type_id = document_upload_type_id THEN
        INSERT INTO gendox_core.organization_daily_usage (organization_id, date, document_uploads)
        VALUES (NEW.organization_id, NEW.created_at::date, 1)
        ON CONFLICT (organization_id, date)
            DO UPDATE SET document_uploads = gendox_core.organization_daily_usage.document_uploads + EXCLUDED.document_uploads;

        -- Check for 'CREATE_DOCUMENT_SECTIONS' type
    ELSIF NEW.type_id = document_sections_type_id THEN
        INSERT INTO gendox_core.organization_daily_usage (organization_id, date, document_sections)
        VALUES (NEW.organization_id, NEW.created_at::date, 1)
        ON CONFLICT (organization_id, date)
            DO UPDATE SET document_sections = gendox_core.organization_daily_usage.document_sections + EXCLUDED.document_sections;

        -- Add more conditions as necessary for other metrics
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Create or replace the trigger
-- Drop the existing trigger if it exists
DO $$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_organization_daily_usage'
        ) THEN
            DROP TRIGGER trg_update_organization_daily_usage ON gendox_core.audit_logs;
        END IF;

        -- Create the trigger as BEFORE INSERT
        CREATE TRIGGER trg_update_organization_daily_usage
            AFTER INSERT ON gendox_core.audit_logs
            FOR EACH ROW
        EXECUTE FUNCTION gendox_core.update_organization_daily_usage();
    END;
$$;

