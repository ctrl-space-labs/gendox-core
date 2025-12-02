INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'gemini-3-pro-preview',
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    'GEMINI_3-PRO-PREVIEW',
    0.018,
    NOW(),
    NOW(),
    'Adaptive thinking, best for complex tasks',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'GEMINI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'GEMINI_3-PRO-PREVIEW'
);


-- GPT-5.1
INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description,
 ai_model_type_id, api_type_id, model_tier_type_id,
 organization_id, ai_model_provider_id, is_active)
SELECT
    'gpt-5.1',
    'https://api.openai.com/v1/chat/completions',
    'GPT-5.1',
    0.01,
    NOW(),
    NOW(),
    'Flagship GPT-5.1 reasoning model with adaptive reasoning.',
    (SELECT id FROM gendox_core.types
     WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers
     WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types
     WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers
     WHERE name = 'OPEN_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.ai_models WHERE name = 'GPT-5.1'
);

-- GPT-5.1-CHAT-LATEST
INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description,
 ai_model_type_id, api_type_id, model_tier_type_id,
 organization_id, ai_model_provider_id, is_active)
SELECT
    'gpt-5.1-chat-latest',
    'https://api.openai.com/v1/chat/completions',
    'GPT-5.1-CHAT-LATEST',
    0.01,
    NOW(),
    NOW(),
    'GPT-5.1 Instant chat route (gpt-5.1-chat-latest).',
    (SELECT id FROM gendox_core.types
     WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers
     WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types
     WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers
     WHERE name = 'OPEN_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.ai_models WHERE name = 'GPT-5.1-CHAT-LATEST'
);

-- GPT-5-MINI
INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description,
 ai_model_type_id, api_type_id, model_tier_type_id,
 organization_id, ai_model_provider_id, is_active)
SELECT
    'gpt-5-mini',
    'https://api.openai.com/v1/chat/completions',
    'GPT-5-MINI',
    0.002, -- $2 / 1M → 0.002 per 1K
    NOW(),
    NOW(),
    'Faster, cheaper GPT-5-mini for well-defined tasks.',
    (SELECT id FROM gendox_core.types
     WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers
     WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types
     WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers
     WHERE name = 'OPEN_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.ai_models WHERE name = 'GPT-5-MINI'
);

-- GPT-5-NANO
INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description,
 ai_model_type_id, api_type_id, model_tier_type_id,
 organization_id, ai_model_provider_id, is_active)
SELECT
    'gpt-5-nano',
    'https://api.openai.com/v1/chat/completions',
    'GPT-5-NANO',
    0.0004,
    NOW(),
    NOW(),
    'Fastest, most cost-effective GPT-5 model for lightweight tasks.',
    (SELECT id FROM gendox_core.types
     WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers
     WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types
     WHERE name = 'FREE_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers
     WHERE name = 'OPEN_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.ai_models WHERE name = 'GPT-5-NANO'
);




