-- Create columns if they don't exist
ALTER TABLE gendox_core.project_agent
    ADD COLUMN IF NOT EXISTS user_id UUID,
    ADD FOREIGN KEY IF NOT EXISTS (user_id) REFERENCES gendox_core.users (id);

-- Delete column
ALTER TABLE IF EXISTS gendox_core.users
DROP COLUMN IF EXISTS global_role_id;