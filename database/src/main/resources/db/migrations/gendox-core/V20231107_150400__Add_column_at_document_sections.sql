-- Create columns if they don't exist
ALTER TABLE gendox_core.document_instance_sections
    ADD COLUMN IF NOT EXISTS has_content_warning boolean;