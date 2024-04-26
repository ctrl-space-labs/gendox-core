-- Create columns if they don't exist
ALTER TABLE gendox_core.message
    ADD COLUMN IF NOT EXISTS thread_id UUID;

-- Create columns if they don't exist

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'gendox_core'
        AND table_name = 'message'
        AND column_name = 'project_id'
    ) THEN
        ALTER TABLE gendox_core.message
        ADD COLUMN project_id UUID,
        ADD FOREIGN KEY (project_id) REFERENCES gendox_core.projects (id);
    END IF;
END $$;

