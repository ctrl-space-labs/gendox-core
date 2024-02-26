-- Create columns if they don't exist
ALTER TABLE IF EXISTS gendox_core.integrations
      ADD COLUMN IF NOT EXISTS queue_name VARCHAR(255);

