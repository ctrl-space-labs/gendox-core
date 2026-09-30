-- Decision models are a separate capability from completion models. Jev is the
-- first adapter; future models can use the same DECISION_MODEL contract.
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AI_MODEL_TYPE', 'DECISION_MODEL', 'Structured probabilistic decision model'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types
    WHERE type_category = 'AI_MODEL_TYPE' AND name = 'DECISION_MODEL'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AI_MODEL_API_TYPE', 'TYPESAFE_DECISION_API', 'TypeSafe SystemOne decision API'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types
    WHERE type_category = 'AI_MODEL_API_TYPE' AND name = 'TYPESAFE_DECISION_API'
);

INSERT INTO gendox_core.ai_model_providers
    (name, api_type_id, description, created_at, updated_at)
SELECT 'TYPESAFE_AI',
       (SELECT id FROM gendox_core.types
        WHERE type_category = 'AI_MODEL_API_TYPE' AND name = 'TYPESAFE_DECISION_API'),
       'TypeSafe AI decision models. Key: TYPESAFE_AI_KEY', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.ai_model_providers WHERE name = 'TYPESAFE_AI'
);

INSERT INTO gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, description,
     ai_model_type_id, api_type_id, model_tier_type_id, organization_id,
     ai_model_provider_id, is_active, supports_reasoning,
     supports_sampling_params, model_origin, hosting_region)
SELECT 'jev-latest', 'https://api.typesafe.ai/v1/systemone', 'JEV-LATEST',
       0.000042, NOW(), NOW(),
       'Latest Jev decision model for Boolean, choice and ordered score questions.',
       (SELECT id FROM gendox_core.types
        WHERE type_category = 'AI_MODEL_TYPE' AND name = 'DECISION_MODEL'),
       (SELECT id FROM gendox_core.types
        WHERE type_category = 'AI_MODEL_API_TYPE' AND name = 'TYPESAFE_DECISION_API'),
       (SELECT id FROM gendox_core.types
        WHERE type_category = 'MODEL_TIER' AND name = 'FREE_MODEL'),
       NULL,
       (SELECT id FROM gendox_core.ai_model_providers WHERE name = 'TYPESAFE_AI'),
       TRUE, FALSE, FALSE, 'US', 'US'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.ai_models WHERE name = 'JEV-LATEST'
);

ALTER TABLE gendox_core.project_agent
    ADD COLUMN IF NOT EXISTS decision_model_id UUID;

DO $$ BEGIN
    ALTER TABLE gendox_core.project_agent
        ADD CONSTRAINT fk_project_agent_decision_model
        FOREIGN KEY (decision_model_id) REFERENCES gendox_core.ai_models(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

UPDATE gendox_core.project_agent
SET decision_model_id = (SELECT id FROM gendox_core.ai_models WHERE name = 'JEV-LATEST')
WHERE decision_model_id IS NULL;

ALTER TABLE gendox_historic_data.project_agent_history
    ADD COLUMN IF NOT EXISTS decision_model_id UUID;

-- Existing insight questions become explicit written-answer questions. New
-- question creation also applies this default in the service layer.
UPDATE gendox_core.task_nodes node
SET node_value = jsonb_set(
        COALESCE(node.node_value, '{}'::jsonb),
        '{insightConfig}',
        '{"version":1,"answerMode":"GENERATED_TEXT"}'::jsonb,
        TRUE
    )
WHERE node.node_type_id = (
        SELECT id FROM gendox_core.types
        WHERE type_category = 'TASK_NODE_TYPE' AND name = 'QUESTION'
    )
  AND NOT COALESCE(node.node_value, '{}'::jsonb) ? 'insightConfig';


INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AUDIT_LOG_TYPE', 'DECISION_REQUEST', 'Input token usage for a decision model request.'
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'AUDIT_LOG_TYPE' AND name = 'DECISION_REQUEST'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AUDIT_LOG_TYPE', 'DECISION_RESPONSE', 'Output token usage for a decision model response.'
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'AUDIT_LOG_TYPE' AND name = 'DECISION_RESPONSE'
);


