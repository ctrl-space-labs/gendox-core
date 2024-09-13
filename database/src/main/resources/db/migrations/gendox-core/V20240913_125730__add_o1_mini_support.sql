INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id)
SELECT
    'o1-mini',
    'https://api.openai.com/v1/chat/completions',
    'O1_MINI',
    0.003,
    NOW(),
    NOW(),
    'OpenAI O1 Mini',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI')
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'O1_MINI'
);
