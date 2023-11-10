ALTER TABLE gendox_core.audit_logs
    ADD COLUMN IF NOT EXISTS type_id bigint,
    ADD FOREIGN KEY (type_id) REFERENCES gendox_core.types (id);

DO $$
    BEGIN
        -- Check if the column is NOT NULL
        IF EXISTS (SELECT 1
                   FROM pg_attribute
                   WHERE attrelid = 'gendox_core.audit_logs'::regclass
                     AND attname = 'user_id'
                     AND attnotnull) THEN
            -- If it is, then drop the NOT NULL constraint
            EXECUTE 'ALTER TABLE gendox_core.audit_logs ALTER COLUMN user_id DROP NOT NULL';
        END IF;
    END$$;

-- add column automated_training if not exists in projects
ALTER TABLE gendox_core.projects
    ADD COLUMN IF NOT EXISTS auto_training boolean DEFAULT false;


INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AUDIT_LOG_TYPE', 'EMBEDDING_REQUEST', 'This is for embedding request auditing.'
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'AUDIT_LOG_TYPE' AND name = 'EMBEDDING_REQUEST'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AUDIT_LOG_TYPE', 'COMPLETION_REQUEST', 'This is for completion request auditing.'
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'AUDIT_LOG_TYPE' AND name = 'COMPLETION_REQUEST'
);


INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AUDIT_LOG_TYPE', 'STARTED_TRAINING', 'This is for started training auditing.'
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'AUDIT_LOG_TYPE' AND name = 'STARTED_TRAINING'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AUDIT_LOG_TYPE', 'DELETE_ORGANIZATION', 'This is for delete organization auditing.'
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'AUDIT_LOG_TYPE' AND name = 'DELETE_ORGANIZATION'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AUDIT_LOG_TYPE', 'DELETE_PROJECT', 'This is for delete project auditing.'
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'AUDIT_LOG_TYPE' AND name = 'DELETE_PROJECT'
);





