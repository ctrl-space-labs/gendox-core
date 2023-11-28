
UPDATE gendox_core.project_agent AS pa
SET semantic_search_model_id = (
    SELECT id
    FROM gendox_core.ai_models AS am
    WHERE am.model_name = 'Ada2'
    LIMIT 1
)
WHERE semantic_search_model_id IS NULL;

UPDATE gendox_core.project_agent AS pa
SET completion_model_id  = (
    SELECT id
    FROM gendox_core.ai_models AS am
    WHERE am.model_name = 'gpt-3.5-turbo'
    LIMIT 1
)
WHERE completion_model_id IS NULL;