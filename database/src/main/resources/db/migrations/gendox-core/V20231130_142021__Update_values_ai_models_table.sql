
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'gendox_core'
        AND table_name = 'ai_models'
        AND column_name = 'model_name'
    ) THEN
        ALTER TABLE gendox_core.ai_models RENAME COLUMN model_name TO model;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'gendox_core'
        AND table_name = 'ai_models'
        AND column_name = 'type'
    ) THEN
        ALTER TABLE gendox_core.ai_models RENAME COLUMN type TO name;
    END IF;

     IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'gendox_core'
        AND table_name = 'ai_models'
        AND column_name = 'description'
    ) THEN
        ALTER TABLE gendox_core.ai_models ADD COLUMN description TEXT;
    END IF;


END $$;


