ALTER TABLE IF EXISTS gendox_core.project_agent
      ADD COLUMN IF NOT EXISTS max_token bigint,
      ADD COLUMN IF NOT EXISTS temperature float,
      ADD COLUMN IF NOT EXISTS top_p float;