ALTER TABLE IF EXISTS gendox_core.project_agent
      ADD COLUMN IF NOT EXISTS moderation_check boolean,
      ADD COLUMN IF NOT EXISTS moderation_model_id UUID,
      ADD FOREIGN KEY (moderation_model_id) REFERENCES gendox_core.ai_models (id);


UPDATE gendox_core.project_agent AS pa
SET moderation_model_id  = (
    SELECT id
    FROM gendox_core.ai_models AS am
    WHERE am.model = 'openai-moderation'
    LIMIT 1
)
WHERE moderation_model_id IS NULL;