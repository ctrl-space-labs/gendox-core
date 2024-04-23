CREATE EXTENSION IF NOT EXISTS vector schema public;

CREATE TABLE IF NOT EXISTS gendox_core.message
(
    id uuid,
    value text,
    created_at     timestamp,
    updated_at     timestamp,
    created_by uuid,
    updated_by uuid,
    FOREIGN KEY (created_by) REFERENCES gendox_core.users (id),
    FOREIGN KEY (updated_by) REFERENCES gendox_core.users (id),
    PRIMARY KEY (id)
    );

CREATE TABLE IF NOT EXISTS gendox_core.embedding
(
    id             uuid,
    embedding_vector vector(1536),
    created_at     timestamp,
    updated_at     timestamp,
    created_by uuid,
    updated_by uuid,
    FOREIGN KEY (created_by) REFERENCES gendox_core.users (id),
    FOREIGN KEY (updated_by) REFERENCES gendox_core.users (id),
    PRIMARY KEY (id)

    );


CREATE TABLE IF NOT EXISTS gendox_core.embedding_group
(
    id             uuid,
    section_id     uuid,
    message_id     uuid,
    embedding_id uuid NOT NULL ,
    token_count FLOAT,
    grouping_strategy_type_id  bigint  NOT NULL,
    semantic_search_model_id  bigint  NOT NULL,
    created_at     timestamp,
    updated_at     timestamp,
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id),
    FOREIGN KEY (embedding_id) REFERENCES gendox_core.embedding (id),
    FOREIGN KEY (grouping_strategy_type_id) REFERENCES gendox_core.types (id),
    FOREIGN KEY (semantic_search_model_id) REFERENCES gendox_core.types (id),
    FOREIGN KEY (created_by) REFERENCES gendox_core.users (id),
    FOREIGN KEY (updated_by) REFERENCES gendox_core.users (id),
    FOREIGN KEY (section_id) REFERENCES gendox_core.document_instance_sections (id),
    FOREIGN KEY (message_id) REFERENCES gendox_core.message
    );


ALTER TABLE IF EXISTS gendox_core.ai_models
DROP COLUMN IF EXISTS api_key;


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'gendox_core'
        AND table_name = 'ai_models'
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE gendox_core.ai_models
        ADD COLUMN created_by UUID,
        ADD FOREIGN KEY (created_by) REFERENCES gendox_core.users (id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'gendox_core'
        AND table_name = 'ai_models'
        AND column_name = 'updated_by'
    ) THEN
        ALTER TABLE gendox_core.ai_models
        ADD COLUMN updated_by UUID,
        ADD FOREIGN KEY (updated_by) REFERENCES gendox_core.users (id);
    END IF;
END $$;

-- Rename the column name to modelName
DO $$
BEGIN
        IF EXISTS(SELECT *
                  FROM information_schema.columns
                  WHERE table_name='ai_models' and column_name='name')
        THEN
ALTER TABLE "gendox_core"."ai_models" RENAME COLUMN "name" TO "modelName";
END IF;
END $$;

-- Rename the table message_logs to audit_logs
DO $$
BEGIN
    -- Check if the 'message_logs' table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'message_logs') THEN
        -- Check if the 'audit_logs' table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
            -- If both tables exist, delete 'message_logs'
DROP TABLE "gendox_core"."message_logs";
ELSE
            -- If 'message_logs' exists but 'audit_logs' does not, rename 'message_logs' to 'audit_logs'
ALTER TABLE "gendox_core"."message_logs" RENAME TO "audit_logs";
END IF;
END IF;
END $$;


DO $$
BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'gendox_core'
            AND table_name = 'audit_logs'
            AND column_name = 'created_by'
        ) THEN
            ALTER TABLE gendox_core.audit_logs
            ADD COLUMN created_by UUID,
            ADD FOREIGN KEY (created_by) REFERENCES gendox_core.users (id);
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'gendox_core'
            AND table_name = 'audit_logs'
            AND column_name = 'updated_by'
        ) THEN
            ALTER TABLE gendox_core.audit_logs
            ADD COLUMN updated_by UUID,
            ADD FOREIGN KEY (updated_by) REFERENCES gendox_core.users (id);
        END IF;
END $$;
