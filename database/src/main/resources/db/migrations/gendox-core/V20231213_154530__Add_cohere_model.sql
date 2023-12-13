INSERT into gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description)
select 'command', 'https://api.cohere.ai/v1/generate', 'command', 0.02, now(), now(), 'command text generation endpoint'
where not exists(SELECT * FROM gendox_core.ai_models where model_name = 'command');

INSERT into gendox_core.ai_models
(model, url, name, price, created_at, updated_at, description)
select 'embed-multilingual-v3.0', 'https://api.cohere.ai/v1/embed', 'embed multilingual v3.0', 0.001, now(), now(), 'cohere mulitilingual embeddings endpoint'
where not exists(SELECT * FROM gendox_core.ai_models where model_name = 'embed-multilingual-v3.0');
