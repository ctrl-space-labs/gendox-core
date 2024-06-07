INSERT into gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, ai_model_type_id)
select 'llama3-70b-8192',
       'https://api.groq.com/openai/v1/chat/completions',
       'GROQ_LLAMA_3_70B_8192',
       0.0002,
       now(),
       now(),
       (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE')
where not exists(SELECT * FROM gendox_core.ai_models where name = 'GROQ_LLAMA_3_70B_8192');

INSERT into gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, ai_model_type_id)
select 'llama3-8b-8192',
       'https://api.groq.com/openai/v1/chat/completions',
       'GROQ_LLAMA_3_8B_8192',
       0.0002,
       now(),
       now(),
       (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE')
where not exists(SELECT * FROM gendox_core.ai_models where name = 'GROQ_LLAMA_3_8B_8192');

INSERT into gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, ai_model_type_id)
select 'gpt-4-turbo',
       'https://api.openai.com/v1/chat/completions',
       'GPT_4_TURBO',
       0.0002,
       now(),
       now(),
       (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE')
where not exists(SELECT * FROM gendox_core.ai_models where name = 'GPT_4_TURBO');

INSERT into gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, ai_model_type_id)
select 'gpt-4o',
       'https://api.openai.com/v1/chat/completions',
       'GPT_4_OMNI',
       0.0002,
       now(),
       now(),
       (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE')
where not exists(SELECT * FROM gendox_core.ai_models where name = 'GPT_4_OMNI');


INSERT into gendox_core.ai_models
    (model, url, name, price, created_at, updated_at, ai_model_type_id)
select 'phi3',
       'http://localhost:11434/api/generate',
       'OLLAMA_PHI3_3.8B',
       0.0002,
       now(),
       now(),
       (SELECT id FROM gendox_core.types WHERE name = 'COMPLETION_MODEL' AND type_category = 'AI_MODEL_TYPE')
where not exists(SELECT * FROM gendox_core.ai_models where name = 'OLLAMA_PHI3_3.8B');


INSERT into gendox_core.ai_models
(model, url, name, price, created_at, updated_at, ai_model_type_id)
select 'mxbai-embed-large',
       'http://localhost:11434/api/embeddings',
       'OLLAMA_MXBAI_EMBED_LARGE',
       0.0002,
       now(),
       now(),
       (SELECT id FROM gendox_core.types WHERE name = 'SEMANTIC_SEARCH_MODEL' AND type_category = 'AI_MODEL_TYPE')
where not exists(SELECT * FROM gendox_core.ai_models where name = 'OLLAMA_MXBAI_EMBED_LARGE');


INSERT into gendox_core.ai_models
(model, url, name, price, created_at, updated_at, ai_model_type_id)
select 'nomic-embed-text',
       'http://localhost:11434/api/embeddings',
       'OLLAMA_NOMIC_EMBED_TEXT',
       0.0002,
       now(),
       now(),
       (SELECT id FROM gendox_core.types WHERE name = 'SEMANTIC_SEARCH_MODEL' AND type_category = 'AI_MODEL_TYPE')
where not exists(SELECT * FROM gendox_core.ai_models where name = 'OLLAMA_NOMIC_EMBED_TEXT');







