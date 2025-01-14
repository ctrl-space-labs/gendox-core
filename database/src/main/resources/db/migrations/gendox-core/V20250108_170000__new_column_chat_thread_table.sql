-- Add columns to temp_integration_files
ALTER TABLE gendox_core.chat_thread
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;