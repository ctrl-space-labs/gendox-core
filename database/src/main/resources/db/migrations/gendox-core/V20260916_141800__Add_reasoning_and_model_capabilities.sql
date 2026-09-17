-- ---------------------------------------------------------------------------
-- Reasoning ("thinking") persistence + per-model capability flags.
--
-- Reasoning is stored in two parts:
--   * reasoning_content  - normalized, human-readable summary. This is the ONLY
--                          reasoning field anything above the adapter layer sees,
--                          so the API and the frontend handle one shape for every
--                          provider.
--   * reasoning_metadata - the provider's opaque replay token (Anthropic's
--                          `signature`, Gemini's thought signature, OpenAI's
--                          `encrypted_content`, Mistral's whole ThinkChunk).
--                          Stored verbatim and never interpreted by Gendox.
--
-- ai_model_id records which model produced the message. Every provider binds its
-- replay token to the producing model, so a thread whose model changed mid-
-- conversation drops the unreplayable token while still rendering its summary.
-- It also answers "which model wrote this?", which nothing recorded before.
-- ---------------------------------------------------------------------------

ALTER TABLE gendox_core.message
    ADD COLUMN IF NOT EXISTS reasoning_content TEXT;
ALTER TABLE gendox_core.message
    ADD COLUMN IF NOT EXISTS reasoning_metadata JSONB;
ALTER TABLE gendox_core.message
    ADD COLUMN IF NOT EXISTS ai_model_id UUID;

DO
$$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'message_ai_model_id_fkey') THEN
            ALTER TABLE gendox_core.message
                ADD CONSTRAINT message_ai_model_id_fkey
                    FOREIGN KEY (ai_model_id) REFERENCES gendox_core.ai_models (id);
        END IF;
    END
$$;

CREATE INDEX IF NOT EXISTS idx_message_ai_model_id ON gendox_core.message (ai_model_id);

COMMENT ON COLUMN gendox_core.message.reasoning_content IS
    'Normalized human-readable reasoning summary. Provider-neutral; safe to render and to replay as plain text.';
COMMENT ON COLUMN gendox_core.message.reasoning_metadata IS
    'Opaque provider-specific reasoning replay token. Stored verbatim, never interpreted by Gendox.';
COMMENT ON COLUMN gendox_core.message.ai_model_id IS
    'Model that produced this message. NULL for user and tool messages. Reasoning metadata is only replayable by the same model, so this also gates replay.';


-- ---------------------------------------------------------------------------
-- ai_models: capability facts.
--
-- These describe what a model's API accepts.
-- ---------------------------------------------------------------------------

ALTER TABLE gendox_core.ai_models
    ADD COLUMN IF NOT EXISTS supports_reasoning BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE gendox_core.ai_models
    ADD COLUMN IF NOT EXISTS default_reasoning_effort TEXT;
ALTER TABLE gendox_core.ai_models
    ADD COLUMN IF NOT EXISTS system_role_name TEXT NOT NULL DEFAULT 'system';
ALTER TABLE gendox_core.ai_models
    ADD COLUMN IF NOT EXISTS supports_sampling_params BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE gendox_core.ai_models
    ADD COLUMN IF NOT EXISTS model_origin TEXT;

-- Dispatch now picks the adapter from this column. It is mandatory now
ALTER TABLE gendox_core.ai_models
    ALTER COLUMN api_type_id SET NOT NULL;

COMMENT ON COLUMN gendox_core.ai_models.supports_reasoning IS
    'Model accepts a reasoning/thinking parameter and can return a reasoning summary.';
COMMENT ON COLUMN gendox_core.ai_models.default_reasoning_effort IS
    'none | minimal | low | medium | high. Fallback when neither the agent nor the request sets one.';
COMMENT ON COLUMN gendox_core.ai_models.system_role_name IS
    'Role name for the system prompt: "system", or "developer" for OpenAI reasoning models.';
COMMENT ON COLUMN gendox_core.ai_models.supports_sampling_params IS
    'FALSE where the endpoint rejects temperature/top_p outright: search-preview models, and reasoning models on the Responses API.';
COMMENT ON COLUMN gendox_core.ai_models.model_origin IS
    'Jurisdiction the model was trained in (US/EU/CN/GLOBAL). Distinct from where it is hosted - see hosting_region.';


-- ---------------------------------------------------------------------------
-- hosting_region: where inference actually runs.
-- ---------------------------------------------------------------------------

ALTER TABLE gendox_core.ai_models
    ADD COLUMN IF NOT EXISTS hosting_region TEXT;

COMMENT ON COLUMN gendox_core.ai_models.hosting_region IS
    'EU | US | GLOBAL. GLOBAL means no region commitment (e.g. Nebius public serverless endpoints).';


-- ---------------------------------------------------------------------------
-- project_agent: the user-facing reasoning preference.
-- ---------------------------------------------------------------------------

ALTER TABLE gendox_core.project_agent
    ADD COLUMN IF NOT EXISTS reasoning_effort TEXT;

COMMENT ON COLUMN gendox_core.project_agent.reasoning_effort IS
    'Agent-level reasoning effort override. NULL falls back to ai_models.default_reasoning_effort.';


-- ---------------------------------------------------------------------------
-- Backfill: reproduce today's hardcoded OpenAiServiceAdapter behaviour exactly.
-- ---------------------------------------------------------------------------

-- Java: List.of("o1","o3","o4","gpt-5-","gpt-5.1","gpt-5.4","gemini-2.5","gemini-3")
--       -> sets reasoning_effort, max_completion_tokens, and role "developer"
UPDATE gendox_core.ai_models
SET supports_reasoning = TRUE,
    system_role_name   = 'developer',
    updated_at         = NOW()
WHERE (model LIKE 'o1%' OR model LIKE 'o3%' OR model LIKE 'o4%'
    OR model LIKE '%gpt-5-%' OR model LIKE '%gpt-5.1%' OR model LIKE '%gpt-5.4%'
    OR model LIKE '%gemini-2.5%' OR model LIKE '%gemini-3%')
  AND supports_reasoning = FALSE;

-- Java: aiModel.getModel().toLowerCase().contains("search-preview")
--       -> temperature, top_p, max_tokens and max_completion_tokens all cleared
UPDATE gendox_core.ai_models
SET supports_sampling_params = FALSE,
    updated_at               = NOW()
WHERE LOWER(model) LIKE '%search-preview%';

-- Java: computeReasoningEffort(). Effort was derived from max_token, which is a
-- proxy the user never set deliberately. The Pro tier cannot be told not to think,
-- so it gets an explicit "medium"; everything else gets "none", which on Google
-- means thinkingBudget 0 - existing agents keep behaving as they do today.
UPDATE gendox_core.ai_models
SET default_reasoning_effort = 'medium',
    updated_at               = NOW()
WHERE supports_reasoning = TRUE
  AND default_reasoning_effort IS NULL
  AND (model LIKE '%gemini-2.5-pro%' OR model LIKE '%gemini-3-pro%' OR model LIKE '%gemini-3.1-pro%');

UPDATE gendox_core.ai_models
SET default_reasoning_effort = 'none',
    updated_at               = NOW()
WHERE supports_reasoning = TRUE
  AND default_reasoning_effort IS NULL;

UPDATE gendox_core.ai_models m
SET supports_reasoning       = TRUE,
    default_reasoning_effort = 'none',
    updated_at               = NOW()
FROM gendox_core.ai_model_providers p
WHERE m.ai_model_provider_id = p.id
  AND p.name = 'VERTEX_AI';

-- Provenance for models that exist today.
UPDATE gendox_core.ai_models m
SET hosting_region = 'US'
FROM gendox_core.ai_model_providers p
WHERE m.ai_model_provider_id = p.id
  AND p.name IN ('OPEN_AI', 'ANTHROPIC_AI', 'GEMINI', 'GROQ', 'COHERE', 'VOYAGE_AI', 'VERTEX_AI')
  AND m.hosting_region IS NULL;

UPDATE gendox_core.ai_models m
SET hosting_region = 'EU'
FROM gendox_core.ai_model_providers p
WHERE m.ai_model_provider_id = p.id
  AND p.name = 'MISTRAL_AI'
  AND m.hosting_region IS NULL;

UPDATE gendox_core.ai_models m
SET model_origin = 'US'
FROM gendox_core.ai_model_providers p
WHERE m.ai_model_provider_id = p.id
  AND p.name IN ('OPEN_AI', 'ANTHROPIC_AI', 'GEMINI', 'COHERE', 'VOYAGE_AI', 'VERTEX_AI')
  AND m.model_origin IS NULL;

UPDATE gendox_core.ai_models m
SET model_origin = 'EU'
FROM gendox_core.ai_model_providers p
WHERE m.ai_model_provider_id = p.id
  AND p.name = 'MISTRAL_AI'
  AND m.model_origin IS NULL;

-- Groq hosts (US) a mix of US and Chinese open-weight models, so origin is
-- per-model there rather than per-provider.
UPDATE gendox_core.ai_models
SET model_origin = 'CN'
WHERE (model LIKE '%qwen%' OR model LIKE '%kimi%' OR model LIKE '%moonshot%' OR model LIKE '%glm%' OR model LIKE '%deepseek%')
  AND model_origin IS NULL;

UPDATE gendox_core.ai_models
SET model_origin = 'US'
WHERE model_origin IS NULL;
