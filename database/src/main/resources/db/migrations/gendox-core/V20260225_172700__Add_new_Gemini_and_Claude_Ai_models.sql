-- Gemini 3.1 Pro Preview and Gemini Embedding 001
INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'gemini-3.1-pro-preview',
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    'GEMINI_3.1-PRO-PREVIEW',
    0.02,
    NOW(),
    NOW(),
    'Adaptive thinking, cost efficiency',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'GEMINI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'GEMINI_3.1-PRO-PREVIEW'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'gemini-embedding-001',
    'https://generativelanguage.googleapis.com/v1beta/openai/embeddings',
    'GEMINI_EMBEDDING_001',
    0,
    NOW(),
    NOW(),
    'Measuring the relatedness of text strings',
    (SELECT id FROM gendox_core.types WHERE name = 'SEMANTIC_SEARCH_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'GEMINI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'GEMINI_EMBEDDING_001'
);

-- Deactivate older Gemini models
UPDATE gendox_core.ai_models
SET is_active = FALSE,
    updated_at = NOW()
WHERE name = 'GEMINI_EMBEDDING'
  AND model = 'gemini-embedding-exp-03-07'
  AND is_active = TRUE;

UPDATE gendox_core.ai_models
SET is_active = FALSE,
    updated_at = NOW()
WHERE name = 'GEMINI_2.5-PRO-PREVIEW'
  AND model = 'gemini-2.5-pro-exp-03-25'
  AND is_active = TRUE;

UPDATE gendox_core.ai_models
SET is_active = FALSE,
    updated_at = NOW()
WHERE name = 'GEMINI_2.5-FLASH-PREVIEW'
  AND model = 'gemini-2.5-flash-preview-04-17'
  AND is_active = TRUE;

UPDATE gendox_core.ai_models
SET is_active = FALSE,
    updated_at = NOW()
WHERE name = 'GEMINI_2.0_FLASH-LITE'
  AND model = 'gemini-2.0-flash-lite'
  AND is_active = TRUE;

UPDATE gendox_core.ai_models
SET is_active = FALSE,
    updated_at = NOW()
WHERE name = 'GEMINI_2.0_FLASH'
  AND model = 'gemini-2.0-flash'
  AND is_active = TRUE;


-- Anthropic Models

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'claude-opus-4-6',
    'https://api.anthropic.com/v1/messages',
    'CLAUDE-OPUS-4-6',
    0.05,
    NOW(),
    NOW(),
    'Our most intelligent model, Highest level of intelligence and capability with toggleable extended thinking',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'ANTHROPIC_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'ANTHROPIC_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'CLAUDE-OPUS-4-6'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'claude-sonnet-4-6',
    'https://api.anthropic.com/v1/messages',
    'CLAUDE-SONNET-4-6',
    0.03,
    NOW(),
    NOW(),
    'Our most intelligent model, Highest level of intelligence and capability with toggleable extended thinking',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'ANTHROPIC_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'ANTHROPIC_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'CLAUDE-SONNET-4-6'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'claude-haiku-4-5',
    'https://api.anthropic.com/v1/messages',
    'CLAUDE-HAIKU-4-5',
    0.01,
    NOW(),
    NOW(),
    'Our most intelligent model, Highest level of intelligence and capability with toggleable extended thinking',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'ANTHROPIC_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'ANTHROPIC_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'CLAUDE-HAIKU-4-5'
);

-- Deactivate older Anthropic models

UPDATE gendox_core.ai_models
SET is_active = FALSE,
    updated_at = NOW()
WHERE name = 'CLAUDE-3-7-SONNET'
  AND model = 'claude-3-7-sonnet-20250219'
  AND is_active = TRUE;

UPDATE gendox_core.ai_models
SET is_active = FALSE,
    updated_at = NOW()
WHERE name = 'CLAUDE-3-5-HAIKU'
  AND model = 'claude-3-5-haiku-20241022'
  AND is_active = TRUE;

UPDATE gendox_core.ai_models
SET is_active = FALSE,
    updated_at = NOW()
WHERE name = 'CLAUDE-3-OPUS'
  AND model = 'claude-3-opus-20240229'
  AND is_active = TRUE;

