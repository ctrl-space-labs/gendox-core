-- AI Models and Providers
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AI_MODEL_TYPE', 'RERANK_MODEL', 'This ai-model is for rerank'
WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'AI_MODEL_TYPE'
                    AND name = 'RERANK_MODEL');

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AI_MODEL_TYPE', 'OCR_MODEL', 'This ai-model is for OCR'
WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'AI_MODEL_TYPE'
                    AND name = 'OCR_MODEL');

UPDATE gendox_core.ai_models
SET model = 'text-moderation-latest'
WHERE name = 'OPENAI_MODERATION' AND model != 'text-moderation-latest';

UPDATE gendox_core.ai_models
set is_active = false
where name = 'OLLAMA_MXBAI_EMBED_LARGE'
  and is_active = true;

UPDATE gendox_core.ai_models
set is_active = false
where name = 'GPT_3.5_TURBO'
  and is_active = true;

UPDATE gendox_core.ai_models
set is_active = false
where name = 'GPT_4'
  and is_active = true;

UPDATE gendox_core.ai_models
set is_active = false
where name = 'O1_MINI'
  and is_active = true;

UPDATE gendox_core.ai_models
set is_active = false
where name = 'Ada2'
  and is_active = true;

UPDATE gendox_core.ai_models
set is_active = false
where name = 'OLLAMA_PHI3_3.8B'
  and is_active = true;

UPDATE gendox_core.ai_models
set is_active = false
where name = 'OLLAMA_NOMIC_EMBED_TEXT'
  and is_active = true;

UPDATE gendox_core.ai_models
set is_active = false
where name = 'GROQ_LLAMA_3_70B_8192'
  and is_active = true;

UPDATE gendox_core.ai_models
set is_active = false
where name = 'GROQ_LLAMA_3_8B_8192'
  and is_active = true;



-- OPENAI AI Models ----------------------------------------------------------------------------------------------
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
    'omni-moderation-latest',
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

-- Gemini AI models ----------------------------------------------------------------------------------------------
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

-- Anthropic AI models ----------------------------------------------------------------------------------------------
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AI_MODEL_API_TYPE', 'ANTHROPIC_AI_API', 'AnthropicAi Compatible API'
WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'AI_MODEL_API_TYPE'
                    AND name = 'ANTHROPIC_AI_API');

INSERT INTO gendox_core.ai_model_providers
(name, api_type_id, description, created_at, updated_at)
SELECT 'ANTHROPIC_AI',
       (SELECT id FROM gendox_core.types WHERE name = 'ANTHROPIC_AI_API'),
       'AnthropicAi',
       timezone('UTC', NOW()),
       timezone('UTC', NOW())
WHERE NOT EXISTS
          (SELECT 1
           FROM gendox_core.ai_model_providers
           WHERE name = 'ANTHROPIC_AI');

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'claude-3-7-sonnet-20250219',
    'https://api.anthropic.com/v1/messages',
    'CLAUDE-3-7-SONNET',
    0.015,
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
    WHERE name = 'CLAUDE-3-7-SONNET'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'claude-3-5-haiku-20241022',
    'https://api.anthropic.com/v1/messages',
    'CLAUDE-3-5-HAIKU',
    0.004,
    NOW(),
    NOW(),
    'Our fastest model. Intelligence at blazing speeds',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'ANTHROPIC_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'ANTHROPIC_AI'),
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
    'https://api.anthropic.com/v1/messages',
    'CLAUDE-3-OPUS',
    0.075,
    NOW(),
    NOW(),
    'Powerful model for complex tasks. Top-level intelligence, fluency, and understanding',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'ANTHROPIC_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'ANTHROPIC_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'CLAUDE-3-OPUS'
);

-- Cohere AI models ----------------------------------------------------------------------------------------------
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

-- Voyage AI Embeddings ----------------------------------------------------------------------------------------------
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AI_MODEL_API_TYPE', 'VOYAGE_AI_API', 'VoyageAi Compatible API'
WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'AI_MODEL_API_TYPE'
                    AND name = 'VOYAGE_AI_API');

INSERT INTO gendox_core.ai_model_providers
(name, api_type_id, description, created_at, updated_at)
SELECT 'VOYAGE_AI',
       (SELECT id FROM gendox_core.types WHERE name = 'VOYAGE_AI_API'),
       'VoyageAi',
       timezone('UTC', NOW()),
       timezone('UTC', NOW())
WHERE NOT EXISTS
          (SELECT 1
           FROM gendox_core.ai_model_providers
           WHERE name = 'VOYAGE_AI');

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'voyage-3-large',
    'https://api.voyageai.com/v1/embeddings',
    'VOYAGE_3_LARGE',
    0.00018,
    NOW(),
    NOW(),
    'The best general-purpose and multilingual retrieval quality. ',
    (SELECT id FROM gendox_core.types WHERE name = 'SEMANTIC_SEARCH_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'VOYAGE_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'VOYAGE_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'VOYAGE_3_LARGE'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'voyage-3',
    'https://api.voyageai.com/v1/embeddings',
    'VOYAGE_3',
    0.00006,
    NOW(),
    NOW(),
    'Optimized for general-purpose and multilingual retrieval quality. ',
    (SELECT id FROM gendox_core.types WHERE name = 'SEMANTIC_SEARCH_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'VOYAGE_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'VOYAGE_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'VOYAGE_3'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'voyage-3-lite',
    'https://api.voyageai.com/v1/embeddings',
    'VOYAGE_3_LITE',
    0.00002,
    NOW(),
    NOW(),
    'Optimized for latency and cost. ',
    (SELECT id FROM gendox_core.types WHERE name = 'SEMANTIC_SEARCH_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'VOYAGE_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'VOYAGE_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'VOYAGE_3_LITE'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'voyage-code-3',
    'https://api.voyageai.com/v1/embeddings',
    'VOYAGE_CODE_3',
    0.00018,
    NOW(),
    NOW(),
    'Optimized for code retrieval. ',
    (SELECT id FROM gendox_core.types WHERE name = 'SEMANTIC_SEARCH_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'VOYAGE_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'VOYAGE_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'VOYAGE_CODE_3'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'voyage-finance-2',
    'https://api.voyageai.com/v1/embeddings',
    'VOYAGE_FINANCE_2',
    0.00012,
    NOW(),
    NOW(),
    'Optimized for finance retrieval and RAG.  ',
    (SELECT id FROM gendox_core.types WHERE name = 'SEMANTIC_SEARCH_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'VOYAGE_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'VOYAGE_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'VOYAGE_FINANCE_2'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'voyage-law-2',
    'https://api.voyageai.com/v1/embeddings',
    'VOYAGE_LAW_2',
    0.00012,
    NOW(),
    NOW(),
    'Optimized for legal retrieval and RAG. Also improved performance across all domains. ',
    (SELECT id FROM gendox_core.types WHERE name = 'SEMANTIC_SEARCH_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'VOYAGE_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'VOYAGE_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'VOYAGE_LAW_2'
);


-- Mistral AI models ----------------------------------------------------------------------------------------------

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AI_MODEL_API_TYPE', 'MISTRAL_AI_API', 'MistralAi Compatible API'
WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'AI_MODEL_API_TYPE'
                    AND name = 'MISTRAL_AI_API');

INSERT INTO gendox_core.ai_model_providers
(name, api_type_id, description, created_at, updated_at)
SELECT 'MISTRAL_AI',
       (SELECT id FROM gendox_core.types WHERE name = 'MISTRAL_AI_API'),
       'MistralAi',
       timezone('UTC', NOW()),
       timezone('UTC', NOW())
WHERE NOT EXISTS
          (SELECT 1
           FROM gendox_core.ai_model_providers
           WHERE name = 'MISTRAL_AI');

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'mistral-large-latest',
    'https://api.mistral.ai/v1/chat/completions',
    'MISTRAL_LARGE',
    0.006,
    NOW(),
    NOW(),
    'Our top-tier reasoning model for high-complexity tasks with the lastest version released November 2024. ',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'MISTRAL_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'MISTRAL_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'MISTRAL_LARGE'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'codestral-latest',
    'https://api.mistral.ai/v1/chat/completions',
    'CODESTRAL',
    0.0009,
    NOW(),
    NOW(),
    'Our cutting-edge language model for coding with the second version released January 2025, Codestral specializes in low-latency, high-frequency tasks such as fill-in-the-middle (FIM), code correction and test generation.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'MISTRAL_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'MISTRAL_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'CODESTRAL'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'pixtral-large-latest',
    'https://api.mistral.ai/v1/chat/completions',
    'PIXTRAL_LARGE',
    0.006,
    NOW(),
    NOW(),
    'Our frontier-class multimodal model released November 2024. ',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'MISTRAL_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'MISTRAL_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'PIXTRAL_LARGE'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'ministral-3b-latest',
    'https://api.mistral.ai/v1/chat/completions',
    'MISTRAL_3B',
    0.00004,
    NOW(),
    NOW(),
    'World’s best edge model.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'MISTRAL_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'MISTRAL_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'MISTRAL_3B'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'ministral-8b-latest',
    'https://api.mistral.ai/v1/chat/completions',
    'MISTRAL_8B',
    0.0001,
    NOW(),
    NOW(),
    'Powerful edge model with extremely high performance/price ratio.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'MISTRAL_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'MISTRAL_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'MISTRAL_8B'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'open-mistral-nemo',
    'https://api.mistral.ai/v1/chat/completions',
    'OPEN_MISTRAL_NEMO',
    0.00,
    NOW(),
    NOW(),
    'Our best multilingual open source model released July 2024.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'MISTRAL_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'MISTRAL_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'OPEN_MISTRAL_NEMO'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'mistral-small-latest',
    'https://api.mistral.ai/v1/chat/completions',
    'MISTRAL_SMALL',
    0.00,
    NOW(),
    NOW(),
    'A new leader in the small models category with image understanding capabilities, with the lastest version v3.1 released March 2025.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'MISTRAL_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'MISTRAL_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'MISTRAL_SMALL'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'mistral-saba-latest',
    'https://api.mistral.ai/v1/chat/completions',
    'MISTRAL_SABA',
    0.0006,
    NOW(),
    NOW(),
    'A powerfull and efficient model for languages from the Middle East and South Asia.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'MISTRAL_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'MISTRAL_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'MISTRAL_SABA'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'mistral-ocr-latest',
    'https://api.mistral.ai/v1/ocr',
    'MISTRAL_OCR',
    0.0006,
    NOW(),
    NOW(),
    'Our OCR service that enables our users to extract interleaved text and images',
    (SELECT id FROM gendox_core.types WHERE name = 'OCR_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'MISTRAL_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'MISTRAL_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'MISTRAL_OCR'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'mistral-embed',
    'https://api.mistral.ai/v1/embeddings',
    'MISTRAL_EMBED',
    0.0001,
    NOW(),
    NOW(),
    'Our state-of-the-art semantic for extracting representation of text extracts',
    (SELECT id FROM gendox_core.types WHERE name = 'SEMANTIC_SEARCH_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'MISTRAL_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'MISTRAL_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'MISTRAL_EMBED'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'mistral-moderation-latest',
    'https://api.mistral.ai/v1/moderations',
    'MISTRAL_MODERATION',
    0.0001,
    NOW(),
    NOW(),
    'Our moderation service that enables our users to detect harmful text content',
    (SELECT id FROM gendox_core.types WHERE name = 'MODERATION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'MISTRAL_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'MISTRAL_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'MISTRAL_MODERATION'
);


-- RERANK MODELS ----------------------------------------------------------------------------------------------

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'rerank-v3.5',
    'https://api.cohere.ai/v2/rerank',
    'RERANK-V3.5',
    0.002,
    NOW(),
    NOW(),
    'A model that allows for re-ranking English Language documents and semi-structured data (JSON). This model has a context length of 4096 tokens.',
    (SELECT id FROM gendox_core.types WHERE name = 'RERANK_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'COHERE'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'COHERE'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'RERANK-V3.5'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'rerank-multilingual-v3.0',
    'https://api.cohere.ai/v2/rerank',
    'RERANK-MULTILINGUAL-V3.0',
    0.002,
    NOW(),
    NOW(),
    'A model for documents and semi-structure data (JSON) that are not in English. Supports the same languages as embed-multilingual-v3.0. This model has a context length of 4096 tokens.',
    (SELECT id FROM gendox_core.types WHERE name = 'RERANK_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'COHERE'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'COHERE'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'RERANK-MULTILINGUAL-V3.0'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'rerank-2-lite',
    'https://api.voyageai.com/v1/rerank',
    'RERANK-2-LITE',
    0.00005,
    NOW(),
    NOW(),
    'Our generalist reranker optimized for quality with multilingual support.',
    (SELECT id FROM gendox_core.types WHERE name = 'RERANK_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'VOYAGE_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'VOYAGE_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'RERANK-2-LITE'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'rerank-2',
    'https://api.voyageai.com/v1/rerank',
    'RERANK-2',
    0.00002,
    NOW(),
    NOW(),
    'Our generalist reranker optimized for both latency and quality with multilingual support.',
    (SELECT id FROM gendox_core.types WHERE name = 'RERANK_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'VOYAGE_AI'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'VOYAGE_AI'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'RERANK-2'
);

-- Add `rerank_enable` column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'gendox_core'
          AND table_name = 'project_agent'
          AND column_name = 'rerank_enable'
    ) THEN
        ALTER TABLE gendox_core.project_agent
        ADD COLUMN rerank_enable BOOLEAN;
    END IF;
END$$;

-- Add `rerank_model_id` column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'gendox_core'
          AND table_name = 'project_agent'
          AND column_name = 'rerank_model_id'
    ) THEN
        ALTER TABLE gendox_core.project_agent
        ADD COLUMN rerank_model_id UUID;
    END IF;
END$$;

--  add FK constraint (optional and only once!)
 DO $$ BEGIN
     ALTER TABLE gendox_core.project_agent
     ADD CONSTRAINT fk_rerank_model FOREIGN KEY (rerank_model_id)
     REFERENCES gendox_core.ai_models(id);
 EXCEPTION
     WHEN duplicate_object THEN NULL;
 END$$;

-- Set default values for existing rows
UPDATE gendox_core.project_agent
SET rerank_enable = false,
    rerank_model_id = (
        SELECT id FROM gendox_core.ai_models WHERE name = 'RERANK-2' LIMIT 1
    )
WHERE rerank_enable IS NULL
   OR rerank_model_id IS NULL;


-- Groq AI models ----------------------------------------------------------------------------------------------

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'gemma2-9b-it',
    'https://api.groq.com/openai/v1/chat/completions',
    'GEMMA2_9B_IT',
    0.003,
    NOW(),
    NOW(),
    'Google’s model. Summary description and brief definition of inputs and outputs.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'GROQ'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'GROQ'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'GEMMA2_9B_IT'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'llama-3.3-70b-versatile',
    'https://api.groq.com/openai/v1/chat/completions',
    'LLAMA_3.3_70B_VERSATILE',
    0.003,
    NOW(),
    NOW(),
    'Meta models. Llama-3.3-70B-Versatile is Metas advanced multilingual large language model, optimized for a wide range of natural language processing tasks. With 70 billion parameters, it offers high performance across various benchmarks while maintaining efficiency suitable for diverse applications.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'GROQ'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'GROQ'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'LLAMA_3.3_70B_VERSATILE'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'llama-3.3-70b-versatile',
    'https://api.groq.com/openai/v1/chat/completions',
    'LLAMA_3.3_70B_VERSATILE',
    0.003,
    NOW(),
    NOW(),
    'Meta models. Llama-3.3-70B-Versatile is Metas advanced multilingual large language model, optimized for a wide range of natural language processing tasks. With 70 billion parameters, it offers high performance across various benchmarks while maintaining efficiency suitable for diverse applications.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'GROQ'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'GROQ'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'LLAMA_3.3_70B_VERSATILE'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'llama-3.1-8b-instant',
    'https://api.groq.com/openai/v1/chat/completions',
    'LLAMA_3.1_8B_INSTANT',
    0.003,
    NOW(),
    NOW(),
    'Meta models. Llama 3.1 8B on Groq provides low-latency, high-quality responses suitable for real-time conversational interfaces, content filtering systems, and data analysis applications. This model offers a balance of speed and performance with significant cost savings compared to larger models. Technical capabilities include native function calling support, JSON mode for structured output generation, and a 128K token context window for handling large documents.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'GROQ'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'GROQ'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'LLAMA_3.1_8B_INSTANT'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'llama-guard-3-8b',
    'https://api.groq.com/openai/v1/chat/completions',
    'LLAMA_GUARD_3_8B',
    0.003,
    NOW(),
    NOW(),
    'Meta models. Llama-Guard-3-8B is Metas specialized content moderation model designed to identify and classify potentially harmful content. Fine-tuned specifically for content safety, this model analyzes both user inputs and AI-generated outputs using categories based on the MLCommons Taxonomy framework. The model delivers efficient, consistent content screening while maintaining transparency in its classification decisions.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'GROQ'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'GROQ'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'LLAMA_GUARD_3_8B'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id, model_tier_type_id, organization_id, ai_model_provider_id, is_active)
SELECT
    'deepseek-r1-distill-llama-70b',
    'https://api.groq.com/openai/v1/chat/completions',
    'DEEPSEEK_R1_DISTILL_LLAMA_70B',
    0.003,
    NOW(),
    NOW(),
    'DeepSeek-R1-Distill-Llama-70B is a distilled version of DeepSeeks R1 model, fine-tuned from the Llama-3.3-70B-Instruct base model. This model leverages knowledge distillation to retain robust reasoning capabilities and deliver exceptional performance on mathematical and logical reasoning tasks with Groqs industry-leading speed.',
    (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
    (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'GROQ'),
    (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
    NULL,
    (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'GROQ'),
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models
    WHERE name = 'DEEPSEEK_R1_DISTILL_LLAMA_70B'
);

UPDATE gendox_core.ai_models
set is_active = false
where name = 'DEEPSEEK_R1_DISTILL_LLAMA_70B'
  and is_active = true;