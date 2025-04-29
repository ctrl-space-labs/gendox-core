-- Liquibase Migration to update OpenAI models in the database
INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'o4-mini',
    'https://api.openai.com/v1/chat/completions',
    'O4_MINI',
    0.003,
    NOW(),
    NOW(),
    'Faster, mode addordable reasoning model',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'O4_MINI'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'o3',
    'https://api.openai.com/v1/chat/completions',
    'O3',
    0.04,
    NOW(),
    NOW(),
    'Our most powerful readoning model',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'O3'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'gpt-4.1',
    'https://api.openai.com/v1/chat/completions',
    'GPT-4.1',
    0.008,
    NOW(),
    NOW(),
    'Flagship GPT model for complex tasks',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'GPT-4.1'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'gpt-4.1-mini',
    'https://api.openai.com/v1/chat/completions',
    'GPT-4.1-MINI',
    0.0016,
    NOW(),
    NOW(),
    'Balanced for intelligence, speed and cost',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'GPT-4.1-MINI'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'gpt-4.1-nano',
    'https://api.openai.com/v1/chat/completions',
    'GPT-4.1-NANO',
    0.0004,
    NOW(),
    NOW(),
    'Fastest, most cost-effective GPT-4.1 model',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'GPT-4.1-NANO'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'gpt-4o-search-preview',
    'https://api.openai.com/v1/chat/completions',
    'GPT-4o-SEARCH-PREVIEW',
    0.01,
    NOW(),
    NOW(),
    'GPT model for web search in Chat completions',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'GPT-4o-SEARCH-PREVIEW'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'gpt-4o-mini-search-preview',
    'https://api.openai.com/v1/chat/completions',
    'GPT-4o-MINI-SEARCH-PREVIEW',
    0.0006,
    NOW(),
    NOW(),
    'Fast, affordable small model for web search',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'GPT-4o-MINI-SEARCH-PREVIEW'
);

-- This is the new embedding model
INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'text-embedding-3-large',
    'https://api.openai.com/v1/embeddings',
    'OPENAI_EMBEDDING_V3_LARGE',
    0.00013,
    NOW(),
    NOW(),
    'Most capable embedding model',
    (SELECT id FROM gendox_core.types WHERE name = 'SEMANTIC_SEARCH_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'OPENAI_EMBEDDING_V3_LARGE'
);
-- This is the new moderation model
INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'omni-moderation-2024-09-26',
    'https://api.openai.com/v1/moderations',
    'OMNI_MODERATION',
    0.000,
    NOW(),
    NOW(),
    'identify potentially harmful content in text and images',
    (SELECT id FROM gendox_core.types WHERE name = 'MODERATION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'FREE_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'OMNI_MODERATION'
);

-- New ai provider for Gemini
INSERT INTO gendox_core.ai_model_providers
(name, api_type_id, description, created_at, updated_at)
SELECT 'GEMINI',
       (SELECT id FROM gendox_core.types WHERE name = 'OPEN_AI_API'), --It uses the OPEN_AI_API standard
       'Gemini',
       timezone('UTC', NOW()),
       timezone('UTC', NOW())
WHERE NOT EXISTS
          (SELECT 1
           FROM gendox_core.ai_model_providers
           WHERE name = 'GEMINI');

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'gemini-2.0-flash',
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    'GEMINI_2.0_FLASH',
    0.0004,
    NOW(),
    NOW(),
    'Next generation features, speed, thinking, realtime streaming, and multimodal generation',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'GEMINI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'GEMINI_2.0_FLASH'
);
INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'gemini-2.0-flash-lite',
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    'GEMINI_2.0_FLASH-LITE',
    0.0003,
    NOW(),
    NOW(),
    'Cost efficiency and low latency',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'GEMINI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'GEMINI_2.0_FLASH-LITE'
);
INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'gemini-2.5-pro-exp-03-25',
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    'GEMINI_2.5-PRO-PREVIEW',
    0.015,
    NOW(),
    NOW(),
    'Enhanced thinking and reasoning, multimodal understanding, advanced coding, and more',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'GEMINI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'GEMINI_2.5-PRO-PREVIEW'
);
INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'gemini-2.5-flash-preview-04-17',
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    'GEMINI_2.5-FLASH-PREVIEW',
    0.0006,
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
    WHERE name = 'GEMINI_2.5-FLASH-PREVIEW'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'gemini-embedding-exp',
    'https://generativelanguage.googleapis.com/v1beta/openai/embeddings',
    'GEMINI_EMBEDDING',
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
    WHERE name = 'GEMINI_EMBEDDING'
);

-- Anthropic AI
INSERT INTO gendox_core.ai_model_providers
(name, api_type_id, description, created_at, updated_at)
SELECT 'ANTHROPIC',
       (SELECT id FROM gendox_core.types WHERE name = 'OPEN_AI_API'), --It uses the OPEN_AI_API standard
       'Anthropic',
       timezone('UTC', NOW()),
       timezone('UTC', NOW())
WHERE NOT EXISTS
          (SELECT 1
           FROM gendox_core.ai_model_providers
           WHERE name = 'ANTHROPIC');

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'claude-3-7-sonnet-20250219',
    'https://api.anthropic.com/v1/',
    'CLAUDE-3-7-SONNET',
    0.015,
    NOW(),
    NOW(),
    'Our most intelligent model, Highest level of intelligence and capability with toggleable extended thinking',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'ANTHROPIC'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'CLAUDE-3-7-SONNET'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'claude-3-5-haiku-20241022',
    'https://api.anthropic.com/v1/',
    'CLAUDE-3-5-HAIKU',
    0.004,
    NOW(),
    NOW(),
    'Our fastest model. Intelligence at blazing speeds',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'ANTHROPIC'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'CLAUDE-3-5-HAIKU'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'claude-3-opus-20240229',
    'https://api.anthropic.com/v1/',
    'CLAUDE-3-OPUS',
    0.075,
    NOW(),
    NOW(),
    'Powerful model for complex tasks. Top-level intelligence, fluency, and understanding',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'ANTHROPIC'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'CLAUDE-3-OPUS'
);

-- Cohere AI
INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'command-r-plus',
    'https://api.cohere.ai/v2/chat',
    'COMMAND-R-PLUS',
    0.01,
    NOW(),
    NOW(),
    'command-r-plus is an alias for command-r-plus-04-2024, so if you use command-r-plus in the API, that’s the model you’re pointing to.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'COHERE'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'COHERE'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'COMMAND-R-PLUS'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'command-r',
    'https://api.cohere.ai/v2/chat',
    'COMMAND-R',
    0.0006,
    NOW(),
    NOW(),
    'command-r is an alias for command-r-03-2024, so if you use command-r in the API, that’s the model you’re pointing to.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'COHERE'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'COHERE'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'COMMAND-R'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'command-a-03-2025',
    'https://api.cohere.ai/v2/chat',
    'COMMAND-A',
    0.01,
    NOW(),
    NOW(),
    'Command A is our most performant model to date, excelling at tool use, agents, retrieval augmented generation (RAG), and multilingual use cases. Command A has a context length of 256K, only requires two GPUs to run, and has 150% higher throughput compared to Command R+ 08-2024.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'COHERE'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'COHERE'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'COMMAND-A'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'command-r7b-12-2024',
    'https://api.cohere.ai/v2/chat',
    'COMMAND-R7B',
    0.00015,
    NOW(),
    NOW(),
    'command-r7b-12-2024 is a small, fast update delivered in December 2024. It excels at RAG, tool use, agents, and similar tasks requiring complex reasoning and multiple steps.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'COHERE'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'COHERE'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'COMMAND-R7B'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'embed-v4.0',
    'https://api.cohere.ai/v2/embed',
    'EMBED-V4.0',
    0.00012,
    NOW(),
    NOW(),
    'A model that allows for text and images to be classified or turned into embeddings',
    (SELECT id FROM gendox_core.types WHERE name = 'SEMANTIC_SEARCH_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'COHERE'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'COHERE'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'EMBED-V4.0'
);

UPDATE gendox_core.ai_models
SET url = 'https://api.cohere.ai/v2/chat'
WHERE name = 'COHERE_COMMAND'
  AND (url IS DISTINCT FROM 'https://api.cohere.ai/v2/chat');


UPDATE gendox_core.ai_models
SET url = 'https://api.cohere.ai/v2/embed'
WHERE name = 'COHERE_EMBED_MULTILINGUAL_V3.0'
  AND (url IS DISTINCT FROM 'https://api.cohere.ai/v2/embed');


