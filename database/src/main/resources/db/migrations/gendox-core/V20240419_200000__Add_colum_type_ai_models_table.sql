-- Description: This migration script adds a column to the ai_models table to store the type of the ai model.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'gendox_core'
        AND table_name = 'message_section'
        AND column_name = 'section_url'
        AND data_type = 'character varying'
    ) THEN
        ALTER TABLE gendox_core.message_section
        ALTER COLUMN section_url TYPE text;
    END IF;
END $$;

-- Add column type to ai_models table
ALTER TABLE gendox_core.ai_models
    ADD COLUMN IF NOT EXISTS ai_model_type_id bigint,
    ADD FOREIGN KEY (ai_model_type_id) REFERENCES gendox_core.types (id);



-- Insert ai-model types if they don't exist
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AI_MODEL_TYPE', 'SEMANTIC_SEARCH_MODEL', 'This ai-model is for semantic search'
    WHERE NOT EXISTS (
    SELECT *
    FROM gendox_core.types
    WHERE type_category = 'AI_MODEL_TYPE' AND name = 'SEMANTIC_SEARCH_MODEL'
);



INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AI_MODEL_TYPE', 'COMPLETION_MODEL', 'This ai-model is for completion'
    WHERE NOT EXISTS (
    SELECT *
    FROM gendox_core.types
    WHERE type_category = 'AI_MODEL_TYPE' AND name = 'COMPLETION_MODEL'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AI_MODEL_TYPE', 'MODERATION_MODEL', 'This ai-model is for moderation'
    WHERE NOT EXISTS (
    SELECT *
    FROM gendox_core.types
    WHERE type_category = 'AI_MODEL_TYPE' AND name = 'MODERATION_MODEL'
);

-- Update ai-models with ai-model type
UPDATE gendox_core.ai_models AS am_a
SET ai_model_type_id = (SELECT id FROM gendox_core.types WHERE name = 'SEMANTIC_SEARCH_MODEL' AND type_category = 'AI_MODEL_TYPE')
WHERE model = 'text-embedding-ada-002'
AND NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models AS am_b
    WHERE am_b.model = am_a.model AND am_a.ai_model_type_id = (SELECT id FROM gendox_core.types WHERE name = 'SEMANTIC_SEARCH_MODEL' AND type_category = 'AI_MODEL_TYPE')
);

UPDATE gendox_core.ai_models AS am_a
SET ai_model_type_id = (SELECT id FROM gendox_core.types WHERE name = 'SEMANTIC_SEARCH_MODEL' AND type_category = 'AI_MODEL_TYPE')
WHERE model = 'embed-multilingual-v3.0'
AND NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models AS am_b
    WHERE am_b.model = am_a.model AND am_a.ai_model_type_id = (SELECT id FROM gendox_core.types WHERE name = 'SEMANTIC_SEARCH_MODEL' AND type_category = 'AI_MODEL_TYPE')
);

UPDATE gendox_core.ai_models AS am_a
SET ai_model_type_id = (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE')
WHERE model = 'gpt-3.5-turbo'
AND NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models AS am_b
    WHERE am_b.model = am_a.model AND am_a.ai_model_type_id = (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE')
);

UPDATE gendox_core.ai_models AS am_a
SET ai_model_type_id = (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE')
WHERE model = 'gpt-4'
AND NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models AS am_b
    WHERE am_b.model = am_a.model AND am_a.ai_model_type_id = (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE')
);

UPDATE gendox_core.ai_models AS am_a
SET ai_model_type_id = (SELECT id FROM gendox_core.types WHERE name = 'MODERATION_MODEL' AND type_category = 'AI_MODEL_TYPE')
WHERE model = 'openai-moderation'
AND NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models AS am_b
    WHERE am_b.model = am_a.model AND am_a.ai_model_type_id = (SELECT id FROM gendox_core.types WHERE name = 'MODERATION_MODEL' AND type_category = 'AI_MODEL_TYPE')
);

UPDATE gendox_core.ai_models AS am_a
SET ai_model_type_id = (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE')
WHERE model = 'command'
AND NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models AS am_b
    WHERE am_b.model = am_a.model AND am_a.ai_model_type_id = (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE')
);


UPDATE gendox_core.ai_models AS am_a
SET ai_model_type_id = (SELECT id FROM gendox_core.types WHERE name = 'SEMANTIC_SEARCH_MODEL' AND type_category = 'AI_MODEL_TYPE')
WHERE model = 'text-embedding-3-small'
AND NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models AS am_b
    WHERE am_b.model = am_a.model AND am_a.ai_model_type_id = (SELECT id FROM gendox_core.types WHERE name = 'SEMANTIC_SEARCH_MODEL' AND type_category = 'AI_MODEL_TYPE')
);

