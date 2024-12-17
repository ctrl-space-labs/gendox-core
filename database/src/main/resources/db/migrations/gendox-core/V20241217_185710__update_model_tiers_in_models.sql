UPDATE gendox_core.ai_models
SET model_tier_type_id = (SELECT id
                          FROM gendox_core.types
                          WHERE type_category = 'MODEL_TIER'
                            AND name = 'PREMIUM_MODEL');


UPDATE gendox_core.ai_models
SET model_tier_type_id = (SELECT id
                          FROM gendox_core.types
                          WHERE type_category = 'MODEL_TIER'
                            AND name = 'STANDARD_MODEL')
WHERE name = 'O1_MINI' or
    name = 'GPT_4_OMNI' or
    name = 'GPT_4_TURBO';

UPDATE gendox_core.ai_models
SET model_tier_type_id = (SELECT id
                          FROM gendox_core.types
                          WHERE type_category = 'MODEL_TIER'
                            AND name = 'FREE_MODEL')
WHERE name = 'GROQ_LLAMA_3_8B_8192' or
    name = 'OPENAI_MODERATION' or
    name = 'OPENAI_EMBEDDING_V3_SMALL' or
    name = 'COHERE_EMBED_MULTILINGUAL_V3.0' or
    name = 'OLLAMA_PHI3_3.8B' or
    name = 'GPT_4_OMNI_MINI' or
    name = 'GROQ_LLAMA_3_70B_8192';