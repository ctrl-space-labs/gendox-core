

UPDATE gendox_core.ai_models AS am_a
SET model = 'text-embedding-ada-002'
WHERE url = 'https://api.openai.com/v1/embeddings'
AND NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models AS am_b
    WHERE am_b.url = am_a.url AND am_a.model = 'text-embedding-ada-002'
);

UPDATE gendox_core.ai_models AS am_a
SET name = 'Ada2'
WHERE url = 'https://api.openai.com/v1/embeddings'
AND NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models AS am_b
    WHERE am_b.url = am_a.url AND am_a.name = 'Ada2'
);

UPDATE gendox_core.ai_models AS am_a
SET description = 'GPT_3.5_TURBO'
WHERE model = 'gpt-3.5-turbo'
AND NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models AS am_b
    WHERE am_b.model = am_a.model AND am_a.description = 'GPT_3.5_TURBO'
);

UPDATE gendox_core.ai_models AS am_a
SET description = 'GPT_4'
WHERE model = 'gpt-4'
AND NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models AS am_b
    WHERE am_b.model = am_a.model AND am_a.model = 'gpt-4'
);

UPDATE gendox_core.ai_models AS am_a
SET description = 'ADA-002'
WHERE model = 'text-embedding-ada-002'
AND NOT EXISTS (
    SELECT 1
    FROM gendox_core.ai_models AS am_b
    WHERE am_b.model = am_a.model AND am_a.model = 'text-embedding-ada-002'
);