-- Add the 'title' column as TEXT type in the 'document_instance' table
ALTER TABLE gendox_core.document_instance
    ADD COLUMN IF NOT EXISTS title TEXT;


