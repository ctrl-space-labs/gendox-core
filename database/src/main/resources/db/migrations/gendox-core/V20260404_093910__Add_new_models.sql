-- ---------------------------------------------------------------------------
-- Inserts (WHERE NOT EXISTS on gendox_core.ai_models.name)
-- ---------------------------------------------------------------------------

-- Gemini 3.1 Flash-Lite Preview
INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'gemini-3.1-flash-lite-preview',
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    'GEMINI_3.1-FLASH-LITE-PREVIEW',
    0.001,
    NOW(),
    NOW(),
    'Gemini 3.1 Flash-Lite Preview: fastest, most cost-efficient Gemini 3.1 multimodal model.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'GEMINI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.ai_models WHERE name = 'GEMINI_3.1-FLASH-LITE-PREVIEW'
);

-- OpenAI GPT-5.4 family
INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description,
 ai_model_type_id, api_type_id, model_tier_type_id,
 organization_id, ai_model_provider_id, is_active)
SELECT
    'gpt-5.4',
    'https://api.openai.com/v1/chat/completions',
    'GPT-5.4',
    0.0025,
    NOW(),
    NOW(),
    'GPT-5.4 frontier model for agentic, coding, and professional workflows.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.ai_models WHERE name = 'GPT-5.4'
);

INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description,
 ai_model_type_id, api_type_id, model_tier_type_id,
 organization_id, ai_model_provider_id, is_active)
SELECT
    'gpt-5.4-mini',
    'https://api.openai.com/v1/chat/completions',
    'GPT-5.4-MINI',
    0.00075,
    NOW(),
    NOW(),
    'GPT-5.4 mini: fast, efficient model for high-volume and subagent workloads.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.ai_models WHERE name = 'GPT-5.4-MINI'
);

INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description,
 ai_model_type_id, api_type_id, model_tier_type_id,
 organization_id, ai_model_provider_id, is_active)
SELECT
    'gpt-5.4-nano',
    'https://api.openai.com/v1/chat/completions',
    'GPT-5.4-NANO',
    0.0002,
    NOW(),
    NOW(),
    'GPT-5.4 nano: lowest-cost GPT-5.4-class model for classification, extraction, and simple tasks.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'FREE_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.ai_models WHERE name = 'GPT-5.4-NANO'
);

-- Groq
INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'openai/gpt-oss-20b',
    'https://api.groq.com/openai/v1/chat/completions',
    'GROQ_GPT_OSS_20B',
    0.003,
    NOW(),
    NOW(),
    'OpenAI GPT-OSS 20B on Groq: open-weight model for fast inference.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'GROQ'),
    (SELECT id FROM gendox_core.types WHERE name = 'FREE_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'GROQ'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.ai_models WHERE name = 'GROQ_GPT_OSS_20B'
);

INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'openai/gpt-oss-120b',
    'https://api.groq.com/openai/v1/chat/completions',
    'GROQ_GPT_OSS_120B',
    0.003,
    NOW(),
    NOW(),
    'OpenAI GPT-OSS 120B on Groq: larger open-weight model.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'GROQ'),
    (SELECT id FROM gendox_core.types WHERE name = 'FREE_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'GROQ'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.ai_models WHERE name = 'GROQ_GPT_OSS_120B'
);

INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'qwen/qwen3-32b',
    'https://api.groq.com/openai/v1/chat/completions',
    'GROQ_QWEN3_32B',
    0.003,
    NOW(),
    NOW(),
    'Qwen3 32B on Groq: tool use and structured output.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'GROQ'),
    (SELECT id FROM gendox_core.types WHERE name = 'FREE_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'GROQ'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.ai_models WHERE name = 'GROQ_QWEN3_32B'
);

INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'moonshotai/kimi-k2-instruct-0905',
    'https://api.groq.com/openai/v1/chat/completions',
    'GROQ_KIMI_K2_0905',
    0.003,
    NOW(),
    NOW(),
    'Kimi K2 0905 on Groq: long-context MoE model.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'GROQ'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'GROQ'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.ai_models WHERE name = 'GROQ_KIMI_K2_0905'
);

INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'https://api.groq.com/openai/v1/chat/completions',
    'GROQ_LLAMA_4_SCOUT',
    0.003,
    NOW(),
    NOW(),
    'Llama 4 Scout on Groq: efficient multimodal instruct model.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'GROQ'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'GROQ'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.ai_models WHERE name = 'GROQ_LLAMA_4_SCOUT'
);

-- Groq free-tier completion models (idempotent if tier already FREE_MODEL)
UPDATE gendox_core.ai_models
SET model_tier_type_id = (SELECT id FROM gendox_core.types WHERE name = 'FREE_MODEL' AND type_category = 'MODEL_TIER'),
    updated_at = NOW()
WHERE name IN ('GROQ_GPT_OSS_20B', 'GROQ_GPT_OSS_120B', 'GROQ_QWEN3_32B');

-- ---------------------------------------------------------------------------
-- project_agent: remap disabled models (completion + advanced search)
-- ---------------------------------------------------------------------------

UPDATE gendox_core.project_agent pa
SET completion_model_id = n.id,
    updated_at            = NOW()
FROM (SELECT id FROM gendox_core.ai_models WHERE name = 'GPT-5.4-MINI' LIMIT 1) AS n
WHERE pa.completion_model_id = (SELECT id FROM gendox_core.ai_models WHERE name = 'GPT-5-MINI' LIMIT 1)
  AND n.id IS NOT NULL;

UPDATE gendox_core.project_agent pa
SET advanced_search_model_id = n.id,
    updated_at                 = NOW()
FROM (SELECT id FROM gendox_core.ai_models WHERE name = 'GPT-5.4-MINI' LIMIT 1) AS n
WHERE pa.advanced_search_model_id = (SELECT id FROM gendox_core.ai_models WHERE name = 'GPT-5-MINI' LIMIT 1)
  AND n.id IS NOT NULL;

UPDATE gendox_core.project_agent pa
SET completion_model_id = n.id,
    updated_at            = NOW()
FROM (SELECT id FROM gendox_core.ai_models WHERE name = 'GPT-5.4-NANO' LIMIT 1) AS n
WHERE pa.completion_model_id = (SELECT id FROM gendox_core.ai_models WHERE name = 'GPT-5-NANO' LIMIT 1)
  AND n.id IS NOT NULL;

UPDATE gendox_core.project_agent pa
SET advanced_search_model_id = n.id,
    updated_at                 = NOW()
FROM (SELECT id FROM gendox_core.ai_models WHERE name = 'GPT-5.4-NANO' LIMIT 1) AS n
WHERE pa.advanced_search_model_id = (SELECT id FROM gendox_core.ai_models WHERE name = 'GPT-5-NANO' LIMIT 1)
  AND n.id IS NOT NULL;

UPDATE gendox_core.project_agent pa
SET completion_model_id = n.id,
    updated_at            = NOW()
FROM (SELECT id FROM gendox_core.ai_models WHERE name = 'GPT-5.4' LIMIT 1) AS n
WHERE pa.completion_model_id = (SELECT id FROM gendox_core.ai_models WHERE name = 'GPT-5.1' LIMIT 1)
  AND n.id IS NOT NULL;

UPDATE gendox_core.project_agent pa
SET advanced_search_model_id = n.id,
    updated_at                 = NOW()
FROM (SELECT id FROM gendox_core.ai_models WHERE name = 'GPT-5.4' LIMIT 1) AS n
WHERE pa.advanced_search_model_id = (SELECT id FROM gendox_core.ai_models WHERE name = 'GPT-5.1' LIMIT 1)
  AND n.id IS NOT NULL;

UPDATE gendox_core.project_agent pa
SET completion_model_id = n.id,
    updated_at            = NOW()
FROM (SELECT id FROM gendox_core.ai_models WHERE name = 'GPT-5.4' LIMIT 1) AS n
WHERE pa.completion_model_id = (SELECT id FROM gendox_core.ai_models WHERE name = 'GPT-5.1-CHAT-LATEST' LIMIT 1)
  AND n.id IS NOT NULL;

UPDATE gendox_core.project_agent pa
SET advanced_search_model_id = n.id,
    updated_at                 = NOW()
FROM (SELECT id FROM gendox_core.ai_models WHERE name = 'GPT-5.4' LIMIT 1) AS n
WHERE pa.advanced_search_model_id = (SELECT id FROM gendox_core.ai_models WHERE name = 'GPT-5.1-CHAT-LATEST' LIMIT 1)
  AND n.id IS NOT NULL;

UPDATE gendox_core.project_agent pa
SET completion_model_id = n.id,
    updated_at            = NOW()
FROM (SELECT id FROM gendox_core.ai_models WHERE name = 'GEMINI_3.1-PRO-PREVIEW' LIMIT 1) AS n
WHERE pa.completion_model_id = (SELECT id FROM gendox_core.ai_models WHERE name = 'GEMINI_3-PRO-PREVIEW' LIMIT 1)
  AND n.id IS NOT NULL;

UPDATE gendox_core.project_agent pa
SET advanced_search_model_id = n.id,
    updated_at                 = NOW()
FROM (SELECT id FROM gendox_core.ai_models WHERE name = 'GEMINI_3.1-PRO-PREVIEW' LIMIT 1) AS n
WHERE pa.advanced_search_model_id = (SELECT id FROM gendox_core.ai_models WHERE name = 'GEMINI_3-PRO-PREVIEW' LIMIT 1)
  AND n.id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Deactivate superseded models (idempotent: AND is_active = TRUE)
-- ---------------------------------------------------------------------------

UPDATE gendox_core.ai_models
SET is_active = FALSE,
    updated_at = NOW()
WHERE name = 'GEMINI_3-PRO-PREVIEW'
  AND model = 'gemini-3-pro-preview'
  AND is_active = TRUE;


UPDATE gendox_core.ai_models
SET is_active = FALSE,
    updated_at = NOW()
WHERE name = 'GPT-5.1-CHAT-LATEST'
  AND model = 'gpt-5.1-chat-latest'
  AND is_active = TRUE;


