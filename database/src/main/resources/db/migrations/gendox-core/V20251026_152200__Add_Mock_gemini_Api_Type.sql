-- Add MOCK_GEMINI_API type
INSERT into gendox_core.types
(type_category, name, description)
select 'AI_MODEL_API_TYPE', 'MOCK_GEMINI_API', 'Mock Gemini API for performance testing'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'AI_MODEL_API_TYPE'
                   and name = 'MOCK_GEMINI_API');

-- Add Mock Gemini provider
INSERT INTO gendox_core.ai_model_providers
(name, api_type_id, description, created_at, updated_at)
SELECT 'MOCK_GEMINI',
       (SELECT id FROM gendox_core.types WHERE name = 'MOCK_GEMINI_API'),
       'Mock Gemini provider for performance testing',
       timezone('UTC', NOW()),
       timezone('UTC', NOW())
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.ai_model_providers
    WHERE name = 'MOCK_GEMINI'
);

-- Add models (completion and embedding)
INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'mock-gemini-2.0-flash',
    'http://localhost:8080/mock',
    'MOCK_GEMINI',
    0.0,
    NOW(),
    NOW(),
    'Mock Gemini 2.0 Flash - Instant responses for testing',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'MOCK_GEMINI'),
    (SELECT id FROM gendox_core.types WHERE name = 'FREE_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'MOCK_GEMINI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'MOCK_GEMINI'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'mock-gemini-embedding',
    'http://localhost:8080/mock',
    'MOCK_GEMINI_EMBEDDING',
    0.0,
    NOW(),
    NOW(),
    'Mock Gemini 2.0 Flash - Instant responses for testing',
    (SELECT id FROM gendox_core.types WHERE name = 'SEMANTIC_SEARCH_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'MOCK_GEMINI'),
    (SELECT id FROM gendox_core.types WHERE name = 'FREE_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'MOCK_GEMINI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'MOCK_GEMINI_EMBEDDING'
);