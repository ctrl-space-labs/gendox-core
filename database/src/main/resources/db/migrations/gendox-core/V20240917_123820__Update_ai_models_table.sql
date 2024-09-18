ALTER TABLE gendox_core.ai_models
ADD COLUMN IF NOT EXISTS is_active Boolean DEFAULT TRUE;


UPDATE gendox_core.ai_models
SET is_active = false
WHERE  name = 'GPT_4' or name = 'GPT_3.5_TURBO';


UPDATE gendox_core.ai_models
SET model_tier_type_id = (SELECT id
                   FROM gendox_core.types
                   WHERE type_category = 'MODEL_TIER'
                     AND name = 'PREMIUM_MODEL')
WHERE model = 'GPT_4_OMNI' or name = 'O1_MINI';

