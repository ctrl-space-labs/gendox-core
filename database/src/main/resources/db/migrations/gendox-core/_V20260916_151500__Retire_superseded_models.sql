-- ===========================================================================
-- RETIREMENT OF SUPERSEDED MODELS
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- Reusable remap. Called per pair below.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.retire_model(old_name TEXT, new_name TEXT)
    RETURNS TEXT AS
$$
DECLARE
    old_id  UUID;
    new_id  UUID;
    remapped INT := 0;
BEGIN
    SELECT id INTO old_id FROM gendox_core.ai_models WHERE name = old_name;
    SELECT id INTO new_id FROM gendox_core.ai_models WHERE name = new_name;

    IF old_id IS NULL THEN
        RETURN format('SKIP  %s -> %s (old model not present)', old_name, new_name);
    END IF;
    IF new_id IS NULL THEN
        RETURN format('SKIP  %s -> %s (replacement not present - run the additive migration first)', old_name, new_name);
    END IF;

    UPDATE gendox_core.project_agent
    SET completion_model_id = new_id, updated_at = NOW()
    WHERE completion_model_id = old_id;
    GET DIAGNOSTICS remapped = ROW_COUNT;

    UPDATE gendox_core.project_agent
    SET advanced_search_model_id = new_id, updated_at = NOW()
    WHERE advanced_search_model_id = old_id;

    UPDATE gendox_core.project_agent
    SET rerank_model_id = new_id, updated_at = NOW()
    WHERE rerank_model_id = old_id;

    UPDATE gendox_core.ai_models
    SET is_active = FALSE, updated_at = NOW()
    WHERE id = old_id AND is_active = TRUE;

    RETURN format('OK    %s -> %s (%s agent(s) remapped)', old_name, new_name, remapped);
END;
$$ LANGUAGE plpgsql;

-- Deactivates a model that has no replacement at all.
CREATE OR REPLACE FUNCTION pg_temp.retire_dead_model(old_name TEXT)
    RETURNS TEXT AS
$$
DECLARE
    agents INT := 0;
BEGIN
    SELECT count(*) INTO agents
    FROM gendox_core.project_agent pa
             JOIN gendox_core.ai_models m ON m.id = pa.completion_model_id
    WHERE m.name = old_name;

    IF agents > 0 THEN
        -- Deactivating out from under a live agent would break that project's chat.
        RETURN format('BLOCKED %s - still used by %s agent(s). Pick a replacement first.', old_name, agents);
    END IF;

    UPDATE gendox_core.ai_models
    SET is_active = FALSE, updated_at = NOW()
    WHERE name = old_name AND is_active = TRUE;

    RETURN format('OK      %s deactivated (no replacement exists upstream)', old_name);
END;
$$ LANGUAGE plpgsql;


-- ===========================================================================
-- SECTION A - AUTO. Same tier, same or lower price. These run.
-- ===========================================================================

DO
$$
DECLARE
    r TEXT;
BEGIN
    -- OpenAI. All four now route through the Responses API.
    -- gpt-4.1-nano $0.10/M -> gpt-5.6-luna $0.10/M   (FREE -> FREE)
    r := pg_temp.retire_model('GPT-4.1-NANO', 'GPT-5.6-LUNA');        RAISE NOTICE '%', r;
    -- gpt-4o-mini  $0.15/M -> gpt-5.6-luna $0.10/M   (FREE -> FREE, cheaper)
    r := pg_temp.retire_model('GPT_4_OMNI_MINI', 'GPT-5.6-LUNA');         RAISE NOTICE '%', r;
    -- gpt-4.1-mini $0.40/M -> gpt-5.6-terra $0.50/M  (STANDARD -> STANDARD)
    r := pg_temp.retire_model('GPT-4.1-MINI', 'GPT-5.6-LUNA');       RAISE NOTICE '%', r;
    -- gpt-4o       $2.50/M -> gpt-5.6-terra $0.50/M  (STANDARD, cheaper)
    r := pg_temp.retire_model('GPT_4_OMNI', 'GPT-5.6-LUNA');             RAISE NOTICE '%', r;
    -- gpt-4.1      $2.00/M -> gpt-5.6-terra $0.50/M  (STANDARD, cheaper)
    r := pg_temp.retire_model('GPT-4.1', 'GPT-5.6-LUNA');            RAISE NOTICE '%', r;
    -- gpt-4-turbo  $10.00/M -> gpt-5.6-terra $0.50/M (large drop, no capability loss)
    r := pg_temp.retire_model('GPT_4_TURBO', 'GPT-5.6-LUNA');        RAISE NOTICE '%', r;

    -- Anthropic. Direct generational successors.
    -- sonnet-4.6 $3/$15 -> sonnet-5 $2/$10  (cheaper)
    r := pg_temp.retire_model('CLAUDE-SONNET-4-6', 'CLAUDE-SONNET-5'); RAISE NOTICE '%', r;
    -- opus-4.6 $5/$25 -> opus-5 $5/$25      (same price)
    r := pg_temp.retire_model('CLAUDE-OPUS-4-6', 'CLAUDE-OPUS-5');     RAISE NOTICE '%', r;

    -- Mistral Ministral: same family, same sizes, newer generation (2512).
    r := pg_temp.retire_model('MISTRAL_8B', 'MINISTRAL-3-8B');       RAISE NOTICE '%', r;
    -- ministral-3b-latest is still served upstream; this is a product choice.
    r := pg_temp.retire_model('MISTRAL_3B', 'MINISTRAL-3-8B');       RAISE NOTICE '%', r;

    -- Rerank. Stateless - no stored vectors depend on these, so swapping is safe.
    -- rerank-2 16K ctx -> rerank-3-lite 32K ctx, and it is the new default.
    r := pg_temp.retire_model('RERANK-2', 'VOYAGE_RERANK_3_LITE');      RAISE NOTICE '%', r;
    r := pg_temp.retire_model('RERANK-2-LITE', 'VOYAGE_RERANK_3_LITE'); RAISE NOTICE '%', r;
END
$$;



DO
$$
DECLARE
    r TEXT;
BEGIN
    -- ---- Reasoning models -------------------------------------------------

    r := pg_temp.retire_model('O3', 'GPT-5.6-TERRA');            RAISE NOTICE '%', r;
    r := pg_temp.retire_model('O4_MINI', 'GPT-5.6-TERRA');     RAISE NOTICE '%', r;
    r := pg_temp.retire_model('GPT-5-MINI', 'GPT-5.6-LUNA');  RAISE NOTICE '%', r;
    r := pg_temp.retire_model('GPT-5-NANO', 'GPT-5.6-LUNA');   RAISE NOTICE '%', r;
    r := pg_temp.retire_model('GPT-5.1', 'GPT-5.6-TERRA');       RAISE NOTICE '%', r;

    -- ---- Gemini -----------------------------------------------------------
    r := pg_temp.retire_model('GEMINI_2.5-FLASH', 'GEMINI-3.5-FLASH-LITE'); RAISE NOTICE '%', r;
    r := pg_temp.retire_model('GEMINI_2.5-PRO', 'GEMINI-3.5-FLASH-LITE');   RAISE NOTICE '%', r;

    -- ---- Cohere -----------------------------------------------------------
    r := pg_temp.retire_model('COMMAND-R', 'COMMAND-A');      RAISE NOTICE '%', r;
    r := pg_temp.retire_model('COMMAND-R-PLUS', 'COMMAND-A'); RAISE NOTICE '%', r;

    -- ---- Cohere rerank ----------------------------------------------------
    r := pg_temp.retire_model('RERANK-V3.5', 'COHERE_RERANK_V4_PRO'); RAISE NOTICE '%', r;
    r := pg_temp.retire_model('RERANK-MULTILINGUAL-V3.0', 'COHERE_RERANK_V4_PRO'); RAISE NOTICE '%', r;

    -- ---- Groq -------------------------------------------------------------
    r := pg_temp.retire_dead_model('GROQ_QWEN3_32B');      RAISE NOTICE '%', r;
    r := pg_temp.retire_dead_model('GROQ_KIMI_K2_0905');   RAISE NOTICE '%', r;
    r := pg_temp.retire_dead_model('GROQ_LLAMA_4_SCOUT');  RAISE NOTICE '%', r;
    r := pg_temp.retire_dead_model('GROQ_GPT_OSS_20B');    RAISE NOTICE '%', r;
    r := pg_temp.retire_dead_model('GROQ_GPT_OSS_120B');   RAISE NOTICE '%', r;
    r := pg_temp.retire_model('GROQ_QWEN3_32B', 'NEBIUS-QWEN3-30B');       RAISE NOTICE '%', r;
    r := pg_temp.retire_model('GROQ_KIMI_K2_0905', 'NEBIUS-DEEPSEEK-V4-PRO'); RAISE NOTICE '%', r;

    -- ---- Mistral models that no longer exist upstream ---------------------
    r := pg_temp.retire_dead_model('MISTRAL_LARGE');       RAISE NOTICE '%', r;
    r := pg_temp.retire_dead_model('OPEN_MISTRAL_NEMO');   RAISE NOTICE '%', r;
    r := pg_temp.retire_dead_model('PIXTRAL_LARGE');       RAISE NOTICE '%', r;
    r := pg_temp.retire_dead_model('MISTRAL_SABA');        RAISE NOTICE '%', r;
    r := pg_temp.retire_model('MISTRAL_LARGE', 'MISTRAL-MEDIUM-3.5'); RAISE NOTICE '%', r;
END
$$;


-- ===========================================================================
-- REPORT
-- ===========================================================================

SELECT m.name AS retired_model,
       m.is_active,
       (SELECT count(*) FROM gendox_core.project_agent pa WHERE pa.completion_model_id = m.id) AS agents_still_pointing_here
FROM gendox_core.ai_models m
WHERE m.is_active = FALSE
ORDER BY m.updated_at DESC;

-- Sanity check: no agent should be left on an inactive completion model.
SELECT p.name AS project, m.name AS inactive_model_still_in_use
FROM gendox_core.project_agent pa
         JOIN gendox_core.ai_models m ON m.id = pa.completion_model_id
         JOIN gendox_core.projects p ON p.id = pa.project_id
WHERE m.is_active = FALSE;

