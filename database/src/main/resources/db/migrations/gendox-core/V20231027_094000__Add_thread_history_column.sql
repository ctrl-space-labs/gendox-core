-- Create columns if they don't exist
ALTER TABLE gendox_core.message
    ADD COLUMN IF NOT EXISTS thread_id UUID;

-- Create columns if they don't exist
ALTER TABLE gendox_core.message
    ADD COLUMN IF NOT EXISTS project_id UUID,
    ADD FOREIGN KEY (project_id) REFERENCES gendox_core.projects (id);

