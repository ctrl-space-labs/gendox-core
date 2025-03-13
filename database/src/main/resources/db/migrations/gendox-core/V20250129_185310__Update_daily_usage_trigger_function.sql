-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION gendox_core.update_organization_daily_usage()
    RETURNS TRIGGER AS $$
DECLARE
    completion_response_type_id bigint;
    document_create_type_id bigint;
    document_delete_type_id bigint;
    document_sections_type_id bigint;
    audit_value bigint;
BEGIN
    RAISE NOTICE 'NEW.organization_id: %', NEW.organization_id;
    RAISE NOTICE 'NEW.created_at: %', NEW.created_at;
    RAISE NOTICE 'NEW.audit_value: %', NEW.audit_value;

    -- Handle null audit_value by setting it to 0
    audit_value := COALESCE(NEW.audit_value, 0);

    -- Fetch type IDs for relevant types
    SELECT id INTO completion_response_type_id
    FROM gendox_core.types
    WHERE type_category = 'AUDIT_LOG_TYPE'
      AND name = 'COMPLETION_RESPONSE';

    SELECT id INTO document_create_type_id
    FROM gendox_core.types
    WHERE type_category = 'AUDIT_LOG_TYPE'
      AND name = 'DOCUMENT_CREATE';

    SELECT id INTO document_delete_type_id
    FROM gendox_core.types
    WHERE type_category = 'AUDIT_LOG_TYPE'
      AND name = 'DOCUMENT_DELETE';

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
    END IF;

    -- Check for 'DOCUMENT_CREATE' type to update 'document_uploads'
    IF NEW.type_id = document_create_type_id THEN
        INSERT INTO gendox_core.organization_daily_usage (organization_id, date, document_uploads)
        VALUES (NEW.organization_id, NEW.created_at::date, 1)
        ON CONFLICT (organization_id, date)
            DO UPDATE SET document_uploads = gendox_core.organization_daily_usage.document_uploads + EXCLUDED.document_uploads;
    END IF;

    -- Check for 'DOCUMENT_DELETE' type to decrease 'document_uploads'
    IF NEW.type_id = document_delete_type_id THEN
        INSERT INTO gendox_core.organization_daily_usage (organization_id, date, document_uploads)
        VALUES (NEW.organization_id, NEW.created_at::date, -1)
        ON CONFLICT (organization_id, date)
            DO UPDATE SET document_uploads = gendox_core.organization_daily_usage.document_uploads - 1;
    END IF;

    -- Check for 'CREATE_DOCUMENT_SECTIONS' type to update 'document_sections'
    IF NEW.type_id = document_sections_type_id THEN
        INSERT INTO gendox_core.organization_daily_usage (organization_id, date, document_sections)
        VALUES (NEW.organization_id, NEW.created_at::date, 1)
        ON CONFLICT (organization_id, date)
            DO UPDATE SET document_sections = gendox_core.organization_daily_usage.document_sections + EXCLUDED.document_sections;
    END IF;

    -- Check for 'DOCUMENT_CREATE' type to update 'storage_mb'
    IF NEW.type_id = document_create_type_id THEN
        INSERT INTO gendox_core.organization_daily_usage (organization_id, date, storage_mb)
        VALUES (NEW.organization_id, NEW.created_at::date, audit_value)
        ON CONFLICT (organization_id, date)
            DO UPDATE SET storage_mb = gendox_core.organization_daily_usage.storage_mb + audit_value;
    END IF;

    -- Check for 'DOCUMENT_DELETE' type to decrease 'storage_mb'
    IF NEW.type_id = document_delete_type_id THEN
        INSERT INTO gendox_core.organization_daily_usage (organization_id, date, storage_mb)
        VALUES (NEW.organization_id, NEW.created_at::date, -audit_value)
        ON CONFLICT (organization_id, date)
            DO UPDATE SET storage_mb = gendox_core.organization_daily_usage.storage_mb - audit_value;
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

