INSERT into gendox_core.ai_models
(model_name, url, type, price, created_at, updated_at)
select 'gpt-4', 'https://api.openai.com/v1/chat/completions', 'GPT_4', 0.3, now(), now()
where not exists(SELECT * FROM gendox_core.ai_models where model_name = 'gpt-4');
