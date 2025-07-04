-- Add `advanced_enable` column if it doesn't exist
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'gendox_core'
              AND table_name = 'project_agent'
              AND column_name = 'advanced_search_enable'
        ) THEN
            ALTER TABLE gendox_core.project_agent
                ADD COLUMN advanced_search_enable BOOLEAN;
        END IF;
    END$$;

-- Add `rerank_model_id` column if it doesn't exist
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'gendox_core'
              AND table_name = 'project_agent'
              AND column_name = 'advanced_search_model_id'
        ) THEN
            ALTER TABLE gendox_core.project_agent
                ADD COLUMN advanced_search_model_id UUID;
        END IF;
    END$$;

--  add FK constraint (optional and only once!)
DO $$ BEGIN
    ALTER TABLE gendox_core.project_agent
        ADD CONSTRAINT fk_advanced_search_model FOREIGN KEY (advanced_search_model_id)
            REFERENCES gendox_core.ai_models(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END$$;


-- set default value for `advanced_search_enable` false
UPDATE gendox_core.project_agent
SET advanced_search_enable = FALSE
WHERE advanced_search_enable IS NULL;

-- set default value for `advanced_search_model_id` to gpt-4.1-nano
UPDATE gendox_core.project_agent
SET advanced_search_model_id = (
    SELECT id
    FROM gendox_core.ai_models
    WHERE name = 'GPT-4.1-NANO'
)
WHERE advanced_search_model_id IS NULL;