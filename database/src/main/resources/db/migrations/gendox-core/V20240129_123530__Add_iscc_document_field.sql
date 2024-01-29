DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'document_instance'
        AND column_name = 'document_iscc_code'
    ) THEN
        -- Add the new column
        ALTER TABLE gendox_core.document_instance
        ADD COLUMN document_iscc_code VARCHAR(255);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'document_instance_sections'
        AND column_name = 'section_iscc_code'
    ) THEN
        -- Add the new column
        ALTER TABLE gendox_core.document_instance_sections
        ADD COLUMN section_iscc_code VARCHAR(255);
    END IF;
END $$;