-- Add page_count_error column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'document_instance' 
                   AND column_name = 'page_count_error'
                   AND table_schema = 'gendox_core') THEN
        ALTER TABLE gendox_core.document_instance ADD COLUMN page_count_error TEXT;
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN gendox_core.document_instance.page_count_error IS 
    'Stores error messages when automatic page counting fails during backfill operations';