INSERT into gendox_core.ai_models
(model, url, name, price, created_at, updated_at)
select 'llama3-70b-8192', 'https://groq.com/v1/completions', 'GROQ_LLAMA_3_70B_8192', 0.0002, now(), now()
where not exists(SELECT * FROM gendox_core.ai_models where name = 'GROQ_LLAMA_3_70B_8192');

INSERT into gendox_core.ai_models
(model, url, name, price, created_at, updated_at)
select 'llama3-8b-8192', 'https://groq.com/v1/completions', 'GROQ_LLAMA_3_8B_8192', 0.0002, now(), now()
where not exists(SELECT * FROM gendox_core.ai_models where name = 'GROQ_LLAMA_3_8B_8192');

INSERT into gendox_core.ai_models
(model, url, name, price, created_at, updated_at)
select 'gpt-4-turbo', 'https://api.openai.com/v1/chat/completions', 'GPT_4_TURBO', 0.0002, now(), now()
where not exists(SELECT * FROM gendox_core.ai_models where name = 'GPT_4_TURBO');

INSERT into gendox_core.ai_models
(model, url, name, price, created_at, updated_at)
select 'gpt-4o', 'https://api.openai.com/v1/chat/completions', 'GPT_4_OMNI', 0.0002, now(), now()
where not exists(SELECT * FROM gendox_core.ai_models where name = 'GPT_4_OMNI');






