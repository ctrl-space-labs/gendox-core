-- Add columns to temp_integration_files
ALTER TABLE gendox_core.temp_integration_file_checks
    ADD COLUMN IF NOT EXISTS title VARCHAR(255);