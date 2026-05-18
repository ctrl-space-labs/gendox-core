ALTER TABLE gendox_core.project_agent
    ADD COLUMN IF NOT EXISTS auto_digitization BOOLEAN NOT NULL DEFAULT FALSE;
