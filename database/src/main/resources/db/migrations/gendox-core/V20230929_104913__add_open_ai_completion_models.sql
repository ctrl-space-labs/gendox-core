
-- Insert Data to table ai_models
INSERT into gendox_core.ai_models
(model_name, url, type, price, created_at, updated_at)
select 'gpt-3.5-turbo', 'https://api.openai.com/v1/chat/completions', 'GPT_3.5_TURBO', 0.02, now(), now()
where not exists(SELECT * FROM gendox_core.ai_models where model_name = 'gpt-3.5-turbo');


-- Insert Data to table ai_models
INSERT into gendox_core.ai_models
(model_name, url, type, price, created_at, updated_at)
select 'openai-moderation', 'https://api.openai.com/v1/moderations', 'OPENAI_MODERATION', 0, now(), now()
where not exists(SELECT * FROM gendox_core.ai_models where model_name = 'openai-moderation');

