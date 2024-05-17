ALTER TABLE IF EXISTS gendox_core.project_agent
      ADD COLUMN IF NOT EXISTS moderation_check boolean;


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'gendox_core'
        AND table_name = 'project_agent'
        AND column_name = 'moderation_model_id'
    ) THEN
        ALTER TABLE gendox_core.project_agent
        ADD COLUMN moderation_model_id UUID,
        ADD FOREIGN KEY (moderation_model_id) REFERENCES gendox_core.ai_models (id);
    END IF;
END $$;


UPDATE gendox_core.project_agent AS pa
SET moderation_model_id  = (
    SELECT id
    FROM gendox_core.ai_models AS am
    WHERE am.model = 'openai-moderation'
    LIMIT 1
)
WHERE moderation_model_id IS NULL;