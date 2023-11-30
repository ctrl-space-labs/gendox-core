UPDATE TABLE  gendox_core.ai_models
SET model = 'text-embedding-ada-002'
WHERE url = 'https://api.openai.com/v1/embeddings';

UPDATE TABLE  gendox_core.ai_models
SET name = 'Ada2'
WHERE url = 'https://api.openai.com/v1/embeddings';

UPDATE TABLE  gendox_core.ai_models
SET model = 'text-embedding-ada-002'
WHERE url = 'https://api.openai.com/v1/embeddings';

UPDATE gendox_core.ai_models
SET description = 'GPT_3.5_TURBO'
WHERE model = 'gpt-3.5-turbo';

UPDATE gendox_core.ai_models
SET description = 'GPT_4'
WHERE model = 'gpt-4';

UPDATE gendox_core.ai_models
SET description = 'ADA-002'
WHERE model = 'text-embedding-ada-002';
