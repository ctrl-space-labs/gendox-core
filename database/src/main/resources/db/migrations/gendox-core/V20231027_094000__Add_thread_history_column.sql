-- Create columns if they don't exist
ALTER TABLE gendox_core.message
    ADD COLUMN IF NOT EXISTS thread_id UUID,
