UPDATE gendox_core.project_agent
SET completion_model_id = (
    SELECT id FROM gendox_core.ai_models
    WHERE model = 'gpt-4o' AND name = 'GPT_4_OMNI'
)
WHERE completion_model_id = (
    SELECT id FROM gendox_core.ai_models
    WHERE model = 'gpt-4' AND name = 'GPT_4'
);


UPDATE gendox_core.project_agent
SET completion_model_id = (
    SELECT id FROM gendox_core.ai_models
    WHERE model = 'gpt-4o-mini' AND name = 'GPT_4_OMNI_MINI'
)
WHERE completion_model_id = (
    SELECT id FROM gendox_core.ai_models
    WHERE model = 'gpt-3.5-turbo' AND name = 'GPT_3.5_TURBO'
);


UPDATE gendox_core.project_agent
SET semantic_search_model_id = (
    SELECT id FROM gendox_core.ai_models
    WHERE model = 'text-embedding-3-small' AND name = 'OPENAI_EMBEDDING_V3_SMALL'
)
WHERE semantic_search_model_id = (
    SELECT id FROM gendox_core.ai_models
    WHERE model = 'text-embedding-ada-002' AND name = 'Ada2'
);
