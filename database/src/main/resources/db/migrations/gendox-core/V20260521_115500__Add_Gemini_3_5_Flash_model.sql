-- Gemini 3.5 flash
INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'gemini-3.5-flash',
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    'GEMINI-3.5-FLASH',
    0.009,
    NOW(),
    NOW(),
    'Gemini 3.1 Flash-Lite Preview: fastest, most cost-efficient Gemini 3.1 multimodal model.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'PREMIUM_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'GEMINI'),
    TRUE
    WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.ai_models WHERE name = 'GEMINI-3.5-FLASH'
);

-- Gemma 4 31B IT (FREE tier, uses GEMINI provider with OpenAI-compatible API)
INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'gemma-4-31b-it',
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    'GEMMA_4-31B-IT',
    0.0006,
    NOW(),
    NOW(),
    'Gemma 4 31B IT: open model with strong multilingual and multimodal capabilities',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'FREE_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'GEMINI'),
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.ai_models WHERE name = 'GEMMA_4-31B-IT');
