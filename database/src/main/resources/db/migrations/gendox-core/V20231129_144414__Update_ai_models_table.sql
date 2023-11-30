ALTER TABLE IF EXISTS gendox_core.ai_models
RENAME COLUMN type TO name;

ALTER TABLE IF EXISTS gendox_core.ai_models
RENAME COLUMN model_name TO model;


ALTER TABLE gendox_core.ai_models
    ADD COLUMN IF NOT EXISTS description TEXT;
