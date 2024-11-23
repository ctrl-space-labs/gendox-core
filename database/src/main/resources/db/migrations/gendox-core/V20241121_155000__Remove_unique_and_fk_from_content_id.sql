-- Drop the foreign key constraint fk_content_id in gendox_core.document_instance
ALTER TABLE gendox_core.document_instance
DROP CONSTRAINT IF EXISTS fk_content_id;

-- Drop the UNIQUE constraint from content_id in gendox_core.temp_integration_file_checks
ALTER TABLE gendox_core.temp_integration_file_checks
DROP CONSTRAINT IF EXISTS temp_integration_file_checks_content_id_key;

-- Create the column if it doesn't exist in the document_instance table
ALTER TABLE gendox_core.document_instance
    ADD COLUMN IF NOT EXISTS title VARCHAR(255);


