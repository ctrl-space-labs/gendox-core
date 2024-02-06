INSERT into gendox_core.ai_models
(model_name, url, type, price, created_at, updated_at)
select 'text-embedding-3-small', 'https://api.openai.com/v1/embeddings', 'OPENAI_ΕMBEDDING_V3_SMALL', 0, now(), now()
where not exists(SELECT * FROM gendox_core.ai_models where model_name = 'text-embedding-3-small');
