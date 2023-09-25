
-- Insert data for Grouping Strategy
INSERT into gendox_core.types
(type_category, name, description)
select '"GROUPING_STRATEGY_TYPE"', '"SIMPLE_SECTION"', 'Simple section grouping strategy type'
    where not exists(SELECT * FROM gendox_core.types where type_category = '"GROUPING_STRATEGY_TYPE"' and name = '"SIMPLE_SECTION"');

INSERT into gendox_core.types
(type_category, name, description)
select 'GROUPING_STRATEGY_TYPE', 'OVERLAP_SECTIONS', 'Overlap sections grouping strategy type'
    where not exists(SELECT * FROM gendox_core.types where type_category = 'GROUPING_STRATEGY_TYPE' and name = 'OVERLAP_SECTIONS');

-- Rename the column nameModel to model_name
DO $$
BEGIN
        IF EXISTS(SELECT *
                  FROM information_schema.columns
                  WHERE table_name='ai_models' and column_name='modelName')
        THEN
ALTER TABLE "gendox_core"."ai_models" RENAME COLUMN "modelName" TO "model_name";
END IF;
END $$;

-- Insert Data to table ai_models
INSERT into gendox_core.ai_models
(model_name, url, type, api_key, price)
select 'Ada2', 'https://api.openai.com/v1/embeddings', 'text-embedding-ada-002', 'sk-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 12
    where not exists(SELECT * FROM gendox_core.ai_models where model_name = 'Ada2' and api_key = 'sk-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');




-- Change from table embedding_group, the column's semantic_search_model_id type and foreign key

-- Step 1: Drop the old column if it exists
-- Check if the old column exists before dropping it
DO $$
BEGIN
    IF EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name = 'embedding_group' AND column_name = 'semantic_search_model_id') THEN
        -- Drop the old column
ALTER TABLE gendox_core.embedding_group DROP COLUMN semantic_search_model_id;
END IF;
END $$;

-- Step 2: Create a new column of type uuid
ALTER TABLE gendox_core.embedding_group ADD COLUMN semantic_search_model_id uuid;

-- Step 3: Add the new foreign key constraint
-- Check if the foreign key constraint exists before adding it
DO $$
BEGIN
    IF NOT EXISTS (SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'embedding_group' AND constraint_name = 'embedding_group_semantic_search_model_fk') THEN
        -- Add the new foreign key constraint
ALTER TABLE gendox_core.embedding_group
    ADD CONSTRAINT embedding_group_semantic_search_model_fk
        FOREIGN KEY (semantic_search_model_id) REFERENCES gendox_core.ai_models(id);
END IF;
END $$;


