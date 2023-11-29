ALTER TABLE gendox_core.ai_models
    RENAME COLUMN model_name TO model,
    RENAME COLUMN type TO name;

ALTER TABLE gendox_core.ai_models
    ADD COLUMN IF NOT EXISTS description TEXT;

UPDATE TABLE IF EXISTS gendox_core.ai_models
SET model = 'text-embedding-ada-002'
WHERE url = 'https://api.openai.com/v1/embeddings';

UPDATE TABLE IF EXISTS gendox_core.ai_models
SET name = 'Ada2'
WHERE url = 'https://api.openai.com/v1/embeddings';

UPDATE TABLE IF EXISTS gendox_core.ai_models
SET name = 'Ada2'
WHERE url = 'https://api.openai.com/v1/embeddings';

UPDATE gendox_core.ai_models
SET description = 'GPT 3.5 TURBO'
WHERE model = 'gpt-3.5-turbo';

UPDATE gendox_core.ai_models
SET description = 'GPT 4'
WHERE model = 'gpt-4';

UPDATE gendox_core.ai_models
SET description = 'ADA-002'
WHERE model = 'text-embedding-ada-002';