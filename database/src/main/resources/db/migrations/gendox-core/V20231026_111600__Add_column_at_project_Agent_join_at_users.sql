-- Create columns if they don't exist
 DO $$
 BEGIN
     IF NOT EXISTS (
         SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'gendox_core'
         AND table_name = 'project_agent'
         AND column_name = 'user_id'
     ) THEN
         ALTER TABLE gendox_core.project_agent
         ADD COLUMN user_id UUID,
         ADD FOREIGN KEY (user_id) REFERENCES gendox_core.users (id);
     END IF;
 END $$;

-- Delete column
ALTER TABLE IF EXISTS gendox_core.users
DROP COLUMN IF EXISTS global_role_id;