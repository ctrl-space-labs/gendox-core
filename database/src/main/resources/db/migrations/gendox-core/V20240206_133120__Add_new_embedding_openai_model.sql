INSERT into gendox_core.ai_models
(model, url, name, price, created_at, updated_at)
select 'text-embedding-3-small', 'https://api.openai.com/v1/embeddings', 'OPENAI_EMBEDDING_V3_SMALL', 0.0002, now(), now()
where not exists(SELECT * FROM gendox_core.ai_models where model = 'text-embedding-3-small');
