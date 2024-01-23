UPDATE gendox_core.project_agent AS pa
SET completion_model_id  = (
    SELECT id
    FROM gendox_core.ai_models AS am
    WHERE am.model = 'gpt-3.5-turbo'
    LIMIT 1
)
WHERE completion_model_id IS NULL;