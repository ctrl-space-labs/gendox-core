-- ---------------------------------------------------------------------------
-- Refreshes the model catalogue and adds the Responses API, xAI and Nebius.
--
-- Nothing is deactivated here - retirement lives in the next migration script.
--

-- ===========================================================================
-- 1. The Responses API type
-- ===========================================================================

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AI_MODEL_API_TYPE', 'OPEN_AI_RESPONSES_API',
       'OpenAI Responses API (/v1/responses). Required for tools + reasoning together, and for reasoning summaries.'
WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'AI_MODEL_API_TYPE'
                    AND name = 'OPEN_AI_RESPONSES_API');


-- ===========================================================================
-- 2. New providers
-- ===========================================================================

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AI_MODEL_API_TYPE', 'OPEN_AI_API', 'OpenAI-compatible chat completions'
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.types
                  WHERE type_category = 'AI_MODEL_API_TYPE' AND name = 'OPEN_AI_API');

INSERT INTO gendox_core.ai_model_providers (name, api_type_id, description, created_at, updated_at, hosting_region)
SELECT 'XAI',
       (SELECT id FROM gendox_core.types WHERE name = 'OPEN_AI_API' AND type_category = 'AI_MODEL_API_TYPE'),
       'xAI (Grok). OpenAI-compatible API at https://api.x.ai/v1. Key: XAI_KEY',
       NOW(), NOW(), 'US'
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.ai_model_providers WHERE name = 'XAI');

-- Nebius Token Factory
INSERT INTO gendox_core.ai_model_providers (name, api_type_id, description, created_at, updated_at, hosting_region)
SELECT 'NEBIUS',
       (SELECT id FROM gendox_core.types WHERE name = 'OPEN_AI_API' AND type_category = 'AI_MODEL_API_TYPE'),
       'Nebius Token Factory. OpenAI-compatible, vLLM-backed. Public endpoints have NO region guarantee. Key: NEBIUS_KEY',
       NOW(), NOW(), 'GLOBAL'
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.ai_model_providers WHERE name = 'NEBIUS');


-- ===========================================================================
-- 3. OpenAI -> Responses API
--
-- Only COMPLETION models move. Embedding and moderation models stay on OPEN_AI_API.
-- ===========================================================================

UPDATE gendox_core.ai_models m
SET api_type_id = (SELECT id FROM gendox_core.types
                   WHERE name = 'OPEN_AI_RESPONSES_API' AND type_category = 'AI_MODEL_API_TYPE'),
    url         = 'https://api.openai.com/v1/responses',
    updated_at  = NOW()
FROM gendox_core.ai_model_providers p, gendox_core.types t
WHERE m.ai_model_provider_id = p.id
  AND p.name = 'OPEN_AI'
  AND m.ai_model_type_id = t.id
  AND t.name = 'COMPLETION_MODEL'
  AND t.type_category = 'AI_MODEL_TYPE'
  -- search-preview models are chat-completions only; on Responses, web search is a
  -- tool rather than a model variant, so moving them would break them.
  AND m.supports_sampling_params = TRUE;

-- Reasoning models on /v1/responses reject temperature and top_p outright
UPDATE gendox_core.ai_models m
SET supports_sampling_params = FALSE,
    updated_at               = NOW()
FROM gendox_core.types t
WHERE m.api_type_id = t.id
  AND t.name = 'OPEN_AI_RESPONSES_API'
  AND m.supports_reasoning = TRUE
  AND m.supports_sampling_params = TRUE;


-- ===========================================================================
-- 4. New models
-- ===========================================================================

-- Helper note: price is DECIMAL(18,12) and documented as "per 1000 tokens".
-- Values below are input price per 1K. See the flagged issue about this column
-- being a single blended number that can no longer model 5x input/output spreads.

INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id,
 model_tier_type_id, organization_id, ai_model_provider_id, is_active,
 supports_reasoning, default_reasoning_effort, system_role_name,
 supports_sampling_params, model_origin)
SELECT v.model, 'https://api.openai.com/v1/responses', v.name, v.price, NOW(), NOW(), v.description,
       (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
       (SELECT id FROM gendox_core.types WHERE name = 'OPEN_AI_RESPONSES_API' AND type_category = 'AI_MODEL_API_TYPE'),
       (SELECT id FROM gendox_core.types WHERE name = v.tier AND type_category = 'MODEL_TIER'),
       NULL,
       (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
       TRUE, TRUE, v.effort, 'developer', FALSE, 'US'
FROM (VALUES
    ('gpt-6-astra',   'GPT-6-ASTRA',   0.00125, 'GPT-6 Astra: most capable OpenAI model, built for hard end-to-end work.', 'PREMIUM_MODEL', 'medium'),
    ('gpt-5.6-sol',   'GPT-5.6-SOL',   0.00125, 'GPT-5.6 Sol: flagship for sophisticated professional applications.',     'PREMIUM_MODEL', 'medium'),
    ('gpt-5.6-terra', 'GPT-5.6-TERRA', 0.00050, 'GPT-5.6 Terra: balances intelligence and cost for everyday work.',       'STANDARD_MODEL', 'low'),
    ('gpt-5.6-luna',  'GPT-5.6-LUNA',  0.00010, 'GPT-5.6 Luna: most cost-efficient GPT-5.6 model.',                       'FREE_MODEL',     'low')
) AS v(model, name, price, description, tier, effort)
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.ai_models WHERE name = v.name);

-- --- Anthropic ------------------------------------------------------------
-- Thinking is adaptive on these; the old thinking.type/budget_tokens form is rejected.
INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id,
 model_tier_type_id, organization_id, ai_model_provider_id, is_active,
 supports_reasoning, default_reasoning_effort, supports_sampling_params, model_origin)
SELECT v.model, 'https://api.anthropic.com/v1/messages', v.name, v.price, NOW(), NOW(), v.description,
       (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
       (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'ANTHROPIC_AI'),
       (SELECT id FROM gendox_core.types WHERE name = v.tier AND type_category = 'MODEL_TIER'),
       NULL,
       (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'ANTHROPIC_AI'),
       TRUE, TRUE, v.effort, FALSE, 'US'
FROM (VALUES
    ('claude-fable-5-1', 'CLAUDE-FABLE-5.1', 0.010, 'Claude Fable 5.1: demanding reasoning and long-horizon agentic work. 1M context.', 'PREMIUM_MODEL',  'high'),
    ('claude-opus-5',    'CLAUDE-OPUS-5',    0.005, 'Claude Opus 5: complex agentic coding and enterprise work. 1M context.',            'PREMIUM_MODEL',  'high'),
    ('claude-sonnet-5',  'CLAUDE-SONNET-5',  0.002, 'Claude Sonnet 5: best combination of speed and intelligence. 1M context.',          'STANDARD_MODEL', 'medium')
) AS v(model, name, price, description, tier, effort)
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.ai_models WHERE name = v.name);


INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id,
 model_tier_type_id, organization_id, ai_model_provider_id, is_active,
 supports_reasoning, default_reasoning_effort, model_origin)
SELECT 'gemini-3.8-flash',
       'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
       'GEMINI-3.8-FLASH', 0.0005, NOW(), NOW(),
       'Gemini 3.8 Flash: long-horizon software engineering, autonomous agents, enterprise workflows.',
       (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
       (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'GEMINI'),
       (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
       NULL,
       (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'GEMINI'),
       TRUE, TRUE, 'low', 'US'
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.ai_models WHERE name = 'GEMINI-3.8-FLASH');

INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id,
 model_tier_type_id, organization_id, ai_model_provider_id, is_active,
 supports_reasoning, default_reasoning_effort, model_origin)
SELECT 'gemini-3.5-flash-lite',
       'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
       'GEMINI-3.5-FLASH-LITE', 0.0001, NOW(), NOW(),
       'Gemini 3.5 Flash-Lite: fastest and most cost-efficient Gemini 3.5 multimodal model.',
       (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
       (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'GEMINI'),
       (SELECT id FROM gendox_core.types WHERE name = 'FREE_MODEL' AND type_category = 'MODEL_TIER'),
       NULL,
       (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'GEMINI'),
       TRUE, TRUE, 'low', 'US'
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.ai_models WHERE name = 'GEMINI-3.5-FLASH-LITE');

-- V20260521_115500 shipped GEMINI-3.5-FLASH with a copy-pasted Flash-Lite description
-- and price 0.009 (= $9000/MTok). That migration is applied, so correct it here.
UPDATE gendox_core.ai_models
SET price       = 0.0003,
    description = 'Gemini 3.5 Flash: balanced multimodal model for everyday work.',
    api_type_id = (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'GEMINI'),
    updated_at  = NOW()
WHERE name = 'GEMINI-3.5-FLASH';

INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id,
 model_tier_type_id, organization_id, ai_model_provider_id, is_active, model_origin)
SELECT 'gemini-embedding-2',
       'https://generativelanguage.googleapis.com/v1beta/openai/embeddings',
       'GEMINI-EMBEDDING-2', 0.0001, NOW(), NOW(),
       'Gemini Embedding 2: multimodal embeddings for text, images, video and audio.',
       (SELECT id FROM gendox_core.types WHERE name = 'SEMANTIC_SEARCH_MODEL' AND type_category = 'AI_MODEL_TYPE'),
       (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'GEMINI'),
       (SELECT id FROM gendox_core.types WHERE name = 'STANDARD_MODEL' AND type_category = 'MODEL_TIER'),
       NULL,
       (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'GEMINI'),
       TRUE, 'US'
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.ai_models WHERE name = 'GEMINI-EMBEDDING-2');

-- --- Mistral (VERIFIED against live /v1/models) ----------------------------
-- Note: there is NO mistral-large-* in the live catalogue. Our mistral-large-latest
-- row is dead, not superseded. The magistral-* reasoning line is not in the public
-- models overview page but is served.
INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id,
 model_tier_type_id, organization_id, ai_model_provider_id, is_active,
 supports_reasoning, default_reasoning_effort, model_origin)
SELECT v.model, 'https://api.mistral.ai/v1/chat/completions', v.name, v.price, NOW(), NOW(), v.description,
       (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
       (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'MISTRAL_AI'),
       (SELECT id FROM gendox_core.types WHERE name = v.tier AND type_category = 'MODEL_TIER'),
       NULL,
       (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'MISTRAL_AI'),
       TRUE, v.reasoning, v.effort, v.origin
FROM (VALUES
    ('mistral-medium-3.5',      'MISTRAL-MEDIUM-3.5',   0.0004,  'Mistral Medium 3.5: frontier-class multimodal model for agentic and coding use.', 'STANDARD_MODEL', TRUE,  'medium', 'EU'),
    ('magistral-medium-latest', 'MAGISTRAL-MEDIUM',     0.0004,  'Magistral Medium: Mistral dedicated reasoning model.',                            'STANDARD_MODEL', TRUE,  'medium', 'EU'),
    ('magistral-small-latest',  'MAGISTRAL-SMALL',      0.0001,  'Magistral Small: compact reasoning model.',                                       'FREE_MODEL',     TRUE,  'low',    'EU'),
    ('ministral-14b-latest',    'MINISTRAL-3-14B',      0.0002,  'Ministral 3 14B: text and vision.',                                               'STANDARD_MODEL', FALSE, NULL,     'EU'),
    ('ministral-8b-latest',     'MINISTRAL-3-8B',       0.0001,  'Ministral 3 8B: efficient text and vision.',                                      'FREE_MODEL',     FALSE, NULL,     'EU'),
    -- Chinese open-weight model hosted by an EU provider under EU law. Absent from
    -- /v1/models because third-party models are not listed there; documented at
    -- https://docs.mistral.ai/models/zai-glm-5-2
    ('zai-glm-5-2',             'ZAI-GLM-5.2',          0.0014,  'Z.ai GLM 5.2 hosted by Mistral: long-context coding and agentic work. 1M context.', 'STANDARD_MODEL', FALSE, NULL,   'CN')
) AS v(model, name, price, description, tier, reasoning, effort, origin)
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.ai_models WHERE name = v.name);

-- --- xAI ------------------------------------------------------------------
INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id,
 model_tier_type_id, organization_id, ai_model_provider_id, is_active,
 supports_reasoning, default_reasoning_effort, model_origin)
SELECT v.model, 'https://api.x.ai/v1/chat/completions', v.name, v.price, NOW(), NOW(), v.description,
       (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
       (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'XAI'),
       (SELECT id FROM gendox_core.types WHERE name = v.tier AND type_category = 'MODEL_TIER'),
       NULL,
       (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'XAI'),
       TRUE, TRUE, v.effort, 'US'
FROM (VALUES
    ('grok-4.6', 'GROK-4.6', 0.0020, 'Grok 4.6: xAI flagship for chat, coding and agentic work. 500K context.', 'PREMIUM_MODEL',  'medium'),
    ('grok-4.3', 'GROK-4.3', 0.00125, 'Grok 4.3: 1M context at lower cost than 4.6. Strong agentic tool calling.', 'STANDARD_MODEL', 'medium')
) AS v(model, name, price, description, tier, effort)
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.ai_models WHERE name = v.name);

-- --- Nebius ---------------------------------------------------------------
INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id,
 model_tier_type_id, organization_id, ai_model_provider_id, is_active,
 supports_reasoning, default_reasoning_effort, model_origin)
SELECT v.model, 'https://api.tokenfactory.nebius.com/v1/chat/completions', v.name, v.price, NOW(), NOW(), v.description,
       (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
       (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'NEBIUS'),
       (SELECT id FROM gendox_core.types WHERE name = v.tier AND type_category = 'MODEL_TIER'),
       NULL,
       (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'NEBIUS'),
       TRUE, v.reasoning, v.effort, 'CN'
FROM (VALUES
    ('Qwen/Qwen3-30B-A3B-Instruct-2507',   'NEBIUS-QWEN3-30B',         0.00010, 'Qwen3 30B on Nebius: cheapest chat and coding option.',            'FREE_MODEL',     FALSE, NULL),
    ('deepseek-ai/DeepSeek-V4-Flash-0731', 'NEBIUS-DEEPSEEK-V4-FLASH', 0.00014, 'DeepSeek V4 Flash on Nebius: 1M context, best price/performance.', 'FREE_MODEL',     TRUE,  'low'),
    ('zai-org/GLM-5.3-Flash',              'NEBIUS-GLM-5.3-FLASH',     0.00015, 'GLM 5.3 Flash on Nebius: 1M context vision model, low cost.',      'FREE_MODEL',     TRUE,  'low'),
    ('Qwen/Qwen3-235B-A22B-Instruct-2507', 'NEBIUS-QWEN3-235B',        0.00020, 'Qwen3 235B on Nebius: broad catalogue workhorse.',                 'FREE_MODEL',     FALSE, NULL),
    ('zai-org/GLM-5.3',                    'NEBIUS-GLM-5.3',           0.00140, 'GLM 5.3 on Nebius: Z.ai flagship for coding and agentic work.',    'STANDARD_MODEL', TRUE,  'medium'),
    ('deepseek-ai/DeepSeek-V4-Pro',        'NEBIUS-DEEPSEEK-V4-PRO',   0.00175, 'DeepSeek V4 Pro on Nebius: 1M context frontier reasoning.',        'STANDARD_MODEL', TRUE,  'medium'),
    ('moonshotai/Kimi-K3',                 'NEBIUS-KIMI-K3',           0.00300, 'Kimi K3 on Nebius: 1M context vision model for agentic tool use.', 'PREMIUM_MODEL',  TRUE,  'medium')
) AS v(model, name, price, description, tier, reasoning, effort)
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.ai_models WHERE name = v.name);

-- --- Embeddings (additive only - switching a project's model invalidates its vectors)
INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id,
 model_tier_type_id, organization_id, ai_model_provider_id, is_active, model_origin)
SELECT 'voyage-4-lite', 'https://api.voyageai.com/v1/embeddings', 'VOYAGE_4_LITE', 0.00002, NOW(), NOW(),
       'Voyage 4 Lite: default embedding model. 1024 dimensions, 32K context.',
       (SELECT id FROM gendox_core.types WHERE name = 'SEMANTIC_SEARCH_MODEL' AND type_category = 'AI_MODEL_TYPE'),
       (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'VOYAGE_AI'),
       (SELECT id FROM gendox_core.types WHERE name = 'FREE_MODEL' AND type_category = 'MODEL_TIER'),
       NULL,
       (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'VOYAGE_AI'),
       TRUE, 'US'
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.ai_models WHERE name = 'VOYAGE_4_LITE');


-- --- Rerank (stateless, so safe to add and switch freely) ------------------
INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id,
 model_tier_type_id, organization_id, ai_model_provider_id, is_active, model_origin)
SELECT v.model, v.url, v.name, v.price, NOW(), NOW(), v.description,
       (SELECT id FROM gendox_core.types WHERE name = 'RERANK_MODEL' AND type_category = 'AI_MODEL_TYPE'),
       (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = v.provider),
       (SELECT id FROM gendox_core.types WHERE name = v.tier AND type_category = 'MODEL_TIER'),
       NULL,
       (SELECT id FROM gendox_core.ai_model_providers WHERE name = v.provider),
       TRUE, 'US'
FROM (VALUES
    ('rerank-v4.0-pro',  'https://api.cohere.com/v2/rerank',  'COHERE_RERANK_V4_PRO',  0.0001, 'Cohere Rerank v4.0 Pro: multilingual, 32K context.',        'COHERE',    'STANDARD_MODEL'),
    ('rerank-v4.0-fast', 'https://api.cohere.com/v2/rerank',  'COHERE_RERANK_V4_FAST', 0.0001, 'Cohere Rerank v4.0 Fast: lower latency, 32K context.',      'COHERE',    'FREE_MODEL'),
    ('rerank-3',         'https://api.voyageai.com/v1/rerank','VOYAGE_RERANK_3',       0.0001, 'Voyage rerank-3: generalist reranker, 32K context.',        'VOYAGE_AI', 'STANDARD_MODEL'),
    ('rerank-3-lite',    'https://api.voyageai.com/v1/rerank','VOYAGE_RERANK_3_LITE',  0.0001, 'Voyage rerank-3-lite: default reranker. Lower latency and cost.', 'VOYAGE_AI', 'FREE_MODEL')
) AS v(model, url, name, price, description, provider, tier)
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.ai_models WHERE name = v.name);


-- ===========================================================================
-- 5. Move existing agents off gpt-5-nano
--
-- GPT-5.6-LUNA is the new default for new agents (ProjectAgentService), so the
-- existing ones follow it. Same FREE tier, $0.10/M against $0.40/M.
-- gpt-5-nano itself stays active; retirement is a separate, manual decision.
-- ===========================================================================

UPDATE gendox_core.project_agent pa
SET completion_model_id = (SELECT id FROM gendox_core.ai_models WHERE name = 'GPT-5.6-LUNA'),
    updated_at          = NOW()
WHERE pa.completion_model_id = (SELECT id FROM gendox_core.ai_models WHERE name = 'GPT-5-NANO');

UPDATE gendox_core.project_agent pa
SET advanced_search_model_id = (SELECT id FROM gendox_core.ai_models WHERE name = 'GPT-5.6-LUNA'),
    updated_at               = NOW()
WHERE pa.advanced_search_model_id = (SELECT id FROM gendox_core.ai_models WHERE name = 'GPT-5-NANO');
