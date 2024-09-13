INSERT into gendox_core.ai_models
(model, url, name, price, created_at, updated_at, ai_model_type_id)
select 'gpt-4o-mini',
       'https://api.openai.com/v1/chat/completions',
       'GPT_4_OMNI_MINI',
       0.0006,
       now(),
       now(),
       (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE')
where not exists(SELECT * FROM gendox_core.ai_models where name = 'GPT_4_OMNI_MINI');


INSERT into gendox_core.types
(type_category, name, description)
select 'AI_MODEL_API_TYPE', 'OPEN_AI_API', 'OpenAI Compatible API'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'AI_MODEL_API_TYPE'
                   and name = 'OPEN_AI_API');

INSERT into gendox_core.types
(type_category, name, description)
select 'AI_MODEL_API_TYPE', 'COHERE_API', 'Cohere Compatible API'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'AI_MODEL_API_TYPE'
                   and name = 'COHERE_API');



INSERT into gendox_core.types
(type_category, name, description)
select 'AI_MODEL_API_TYPE', 'OLLAMA_API', 'Ollama Compatible API'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'AI_MODEL_API_TYPE'
                   and name = 'OLLAMA_API');


-- Create Model API compatibility column
ALTER TABLE gendox_core.ai_models
ADD COLUMN IF NOT EXISTS api_type_id BIGINT;



-- Set default value to OpenAI
UPDATE gendox_core.ai_models
SET api_type_id = (SELECT id
                   FROM gendox_core.types
                   WHERE type_category = 'AI_MODEL_API_TYPE'
                     AND name = 'OPEN_AI_API')
WHERE api_type_id IS NULL;

-- Set Cohere API for Cohere models
UPDATE gendox_core.ai_models
SET api_type_id = (SELECT id
                   FROM gendox_core.types
                   WHERE type_category = 'AI_MODEL_API_TYPE'
                     AND name = 'COHERE_API')
WHERE name = 'COHERE_COMMAND' or name = 'COHERE_EMBED_MULTILINGUAL_V3.0';

-- Set Ollama API for Ollama models
UPDATE gendox_core.ai_models
SET api_type_id = (SELECT id
                   FROM gendox_core.types
                   WHERE type_category = 'AI_MODEL_API_TYPE'
                     AND name = 'OLLAMA_API')
WHERE name = 'OLLAMA_PHI3_3.8B'
   or name = 'OLLAMA_NOMIC_EMBED_TEXT'
   or name = 'OLLAMA_MXBAI_EMBED_LARGE';

