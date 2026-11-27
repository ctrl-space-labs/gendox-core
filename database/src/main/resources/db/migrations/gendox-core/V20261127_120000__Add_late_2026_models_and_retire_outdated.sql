-- ===========================================================================
-- New models (Anthropic, OpenAI, Google) and retirement of outdated ones.
-- Price is input price per 1K tokens, as in V20260916_150500.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. New models
-- ---------------------------------------------------------------------------

-- --- Anthropic ------------------------------------------------------------
-- Thinking is adaptive and always on; effort is the only control. Sampling params are rejected.
INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id,
 model_tier_type_id, organization_id, ai_model_provider_id, is_active,
 supports_reasoning, default_reasoning_effort, supports_sampling_params, model_origin, hosting_region)
SELECT v.model, 'https://api.anthropic.com/v1/messages', v.name, v.price, NOW(), NOW(), v.description,
       (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
       (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'ANTHROPIC_AI'),
       (SELECT id FROM gendox_core.types WHERE name = v.tier AND type_category = 'MODEL_TIER'),
       NULL,
       (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'ANTHROPIC_AI'),
       TRUE, TRUE, v.effort, FALSE, 'US', 'US'
FROM (VALUES
    ('claude-fable-5-2',  'CLAUDE-FABLE-5.2',  0.0080, 'Claude Fable 5.2: most capable Claude model, for demanding reasoning and long-horizon agentic work. 1M context.', 'PREMIUM_MODEL',  'high'),
    ('claude-opus-5-5',   'CLAUDE-OPUS-5.5',   0.0040, 'Claude Opus 5.5: complex agentic coding and enterprise work. 1M context.',                                     'PREMIUM_MODEL',  'high'),
    ('claude-sonnet-5-5', 'CLAUDE-SONNET-5.5', 0.0020, 'Claude Sonnet 5.5: speed and capability for everyday coding, agent and enterprise work. 1M context.',          'STANDARD_MODEL', 'medium'),
    ('claude-haiku-5-5',  'CLAUDE-HAIKU-5.5',  0.0001, 'Claude Haiku 5.5: fastest and most cost-efficient Claude model. 1M context.',                                  'FREE_MODEL',     'low')
) AS v(model, name, price, description, tier, effort)
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.ai_models WHERE name = v.name);

-- --- OpenAI ---------------------------------------------------------------
-- GPT-6.2 Sol rejects reasoning effort 'none'.
INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id,
 model_tier_type_id, organization_id, ai_model_provider_id, is_active,
 supports_reasoning, default_reasoning_effort, system_role_name,
 supports_sampling_params, model_origin, hosting_region)
SELECT v.model, 'https://api.openai.com/v1/responses', v.name, v.price, NOW(), NOW(), v.description,
       (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
       (SELECT id FROM gendox_core.types WHERE name = 'OPEN_AI_RESPONSES_API' AND type_category = 'AI_MODEL_API_TYPE'),
       (SELECT id FROM gendox_core.types WHERE name = v.tier AND type_category = 'MODEL_TIER'),
       NULL,
       (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'OPEN_AI'),
       TRUE, TRUE, v.effort, 'developer', FALSE, 'US', 'US'
FROM (VALUES
    ('gpt-6.2-astra', 'GPT-6.2-ASTRA', 0.0080, 'GPT-6.2 Astra: most capable OpenAI model, for complex reasoning and coding.',      'PREMIUM_MODEL',  'medium'),
    ('gpt-6.2-sol',   'GPT-6.2-SOL',   0.0020, 'GPT-6.2 Sol: everyday work, balancing intelligence and cost.',                    'PREMIUM_MODEL',  'medium'),
    ('gpt-6.1-sol',   'GPT-6.1-SOL',   0.0020, 'GPT-6.1 Sol: near-Astra performance for complex work at a lower cost.',            'PREMIUM_MODEL',  'medium'),
    ('gpt-6.1-terra', 'GPT-6.1-TERRA', 0.0010, 'GPT-6.1 Terra: fast, efficient model for visual reasoning and natural writing.',   'STANDARD_MODEL', 'low')
) AS v(model, name, price, description, tier, effort)
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.ai_models WHERE name = v.name);

-- --- Google ---------------------------------------------------------------
-- Gemini 4 Carbon: $2/M input until 2026-11-30, $4/M from 2026-12-01.
INSERT INTO gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description, ai_model_type_id, api_type_id,
 model_tier_type_id, organization_id, ai_model_provider_id, is_active,
 supports_reasoning, default_reasoning_effort, model_origin, hosting_region)
SELECT v.model, 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', v.name, v.price, NOW(), NOW(), v.description,
       (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE'),
       (SELECT api_type_id FROM gendox_core.ai_model_providers WHERE name = 'GEMINI'),
       (SELECT id FROM gendox_core.types WHERE name = v.tier AND type_category = 'MODEL_TIER'),
       NULL,
       (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'GEMINI'),
       TRUE, TRUE, 'medium', 'US', 'US'
FROM (VALUES
    ('gemini-4-carbon',   'GEMINI-4-CARBON',   0.0040, 'Gemini 4 Carbon: most capable Gemini reasoning model. 1M context.',             'PREMIUM_MODEL'),
    ('gemini-4-neon',     'GEMINI-4-NEON',     0.0030, 'Gemini 4 Neon: frontier intelligence with fast task completion. 1M context.',   'PREMIUM_MODEL'),
    ('gemini-4-hydrogen', 'GEMINI-4-HYDROGEN', 0.0015, 'Gemini 4 Hydrogen: everyday coding and agentic workflows. 1M context.',          'STANDARD_MODEL')
) AS v(model, name, price, description, tier)
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.ai_models WHERE name = v.name);


-- ---------------------------------------------------------------------------
-- Correct prices that no longer match the providers' price lists (input $/1M divided by 1000).
-- Where a dated increase is announced, the new price is used.
-- ---------------------------------------------------------------------------
UPDATE gendox_core.ai_models m
SET price = v.price, updated_at = NOW()
FROM (VALUES
    -- OpenAI
    ('GPT-6-ASTRA',               0.01000),  -- $10.00
    ('GPT-5.6-SOL',               0.00400),  -- $4.00
    ('GPT-5.6-TERRA',             0.00200),  -- $2.00
    ('GPT-5.6-LUNA',              0.00020),  -- $0.20
    ('OPENAI_EMBEDDING_V3_SMALL', 0.00002),  -- $0.02
    -- Google
    ('GEMINI-3.8-FLASH',          0.00150),  -- $0.75 until 2026-12-31, $1.50 from 2027-01-01
    ('GEMINI-3.5-FLASH-LITE',     0.00030),  -- $0.30
    ('GEMINI_3.1-PRO-PREVIEW',    0.00200),  -- $2.00 (prompts up to 200K tokens)
    ('GEMINI-EMBEDDING-2',        0.00020),  -- $0.20
    ('GEMINI_EMBEDDING_001',      0.00015),  -- $0.15
    -- Anthropic
    ('CLAUDE-HAIKU-4-5',          0.00100)   -- $1.00
) AS v(name, price)
WHERE m.name = v.name AND m.organization_id IS NULL;


-- ---------------------------------------------------------------------------
-- 2. Retire outdated models
-- Moves every agent and task that uses the old model to its replacement, then deactivates it.
-- Messages keep the model they were answered with.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.retire_model(old_name TEXT, new_name TEXT)
    RETURNS TEXT AS
$$
DECLARE
    old_id   UUID;
    new_id   UUID;
    agents   INT := 0;
    tasks    INT := 0;
    affected INT := 0;
BEGIN
    SELECT id INTO old_id FROM gendox_core.ai_models WHERE name = old_name AND organization_id IS NULL;
    SELECT id INTO new_id FROM gendox_core.ai_models WHERE name = new_name AND organization_id IS NULL;

    IF old_id IS NULL THEN
        RETURN format('SKIP  %s -> %s (old model not present)', old_name, new_name);
    END IF;
    IF new_id IS NULL THEN
        RAISE EXCEPTION 'Replacement % for % is missing', new_name, old_name;
    END IF;

    UPDATE gendox_core.project_agent SET completion_model_id = new_id, updated_at = NOW()
    WHERE completion_model_id = old_id;
    GET DIAGNOSTICS affected = ROW_COUNT; agents := agents + affected;

    UPDATE gendox_core.project_agent SET advanced_search_model_id = new_id, updated_at = NOW()
    WHERE advanced_search_model_id = old_id;
    GET DIAGNOSTICS affected = ROW_COUNT; agents := agents + affected;

    UPDATE gendox_core.project_agent SET decision_model_id = new_id, updated_at = NOW()
    WHERE decision_model_id = old_id;
    GET DIAGNOSTICS affected = ROW_COUNT; agents := agents + affected;

    UPDATE gendox_core.project_agent SET moderation_model_id = new_id, updated_at = NOW()
    WHERE moderation_model_id = old_id;
    GET DIAGNOSTICS affected = ROW_COUNT; agents := agents + affected;

    UPDATE gendox_core.tasks SET completion_model_id = new_id
    WHERE completion_model_id = old_id;
    GET DIAGNOSTICS tasks = ROW_COUNT;

    UPDATE gendox_core.ai_models SET is_active = FALSE, updated_at = NOW()
    WHERE id = old_id AND is_active = TRUE;

    RETURN format('OK    %s -> %s (%s agent field(s), %s task(s) moved)', old_name, new_name, agents, tasks);
END;
$$ LANGUAGE plpgsql;

DO
$$
DECLARE
    r TEXT;
BEGIN
    -- OpenAI: shut down upstream on 2026-07-23
    r := pg_temp.retire_model('GPT-4o-SEARCH-PREVIEW',      'GPT-6-LUNA');  RAISE NOTICE '%', r;
    r := pg_temp.retire_model('GPT-4o-MINI-SEARCH-PREVIEW', 'GPT-6-LUNA');     RAISE NOTICE '%', r;
    -- OpenAI: text-moderation-latest shut down upstream in 2025-10
    r := pg_temp.retire_model('OPENAI_MODERATION',          'OMNI_MODERATION'); RAISE NOTICE '%', r;
    -- OpenAI: deprecated, shuts down 2027-04-01
    r := pg_temp.retire_model('GPT-5.4-NANO',               'GPT-6-LUNA');     RAISE NOTICE '%', r;

    -- Google: shut down upstream on 2026-05-25
    r := pg_temp.retire_model('GEMINI_3.1-FLASH-LITE-PREVIEW', 'GEMINI-3.5-FLASH-LITE'); RAISE NOTICE '%', r;
    -- Google: removed from AI Studio, requests are routed to a newer Flash
    r := pg_temp.retire_model('GEMINI-3.5-FLASH',              'GEMINI-3.8-FLASH');      RAISE NOTICE '%', r;
    -- Google: deprecated preview
    r := pg_temp.retire_model('GEMINI_3-FLASH-PREVIEW',        'GEMINI-3.8-FLASH');      RAISE NOTICE '%', r;
END
$$;
