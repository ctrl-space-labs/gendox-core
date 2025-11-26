CREATE EXTENSION IF NOT EXISTS unaccent;



ALTER TABLE gendox_core.tasks
    ADD COLUMN IF NOT EXISTS completion_model_id uuid
        REFERENCES gendox_core.ai_models (id),
    ADD COLUMN IF NOT EXISTS task_prompt text,
    ADD COLUMN IF NOT EXISTS max_token bigint,
    ADD COLUMN IF NOT EXISTS temperature double precision,
    ADD COLUMN IF NOT EXISTS top_p double precision;

CREATE INDEX IF NOT EXISTS idx_tasks_completion_model
    ON gendox_core.tasks (completion_model_id);

