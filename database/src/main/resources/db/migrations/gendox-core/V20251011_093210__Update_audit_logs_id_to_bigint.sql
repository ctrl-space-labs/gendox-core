-- 1.1 Rename old UUID PK to id_uuid (only if current "id" is uuid)
DO $$
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema='gendox_core' AND table_name='audit_logs'
              AND column_name='id' AND udt_name='uuid'
        ) AND NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema='gendox_core' AND table_name='audit_logs'
              AND column_name='id_uuid'
        ) THEN
            ALTER TABLE gendox_core.audit_logs RENAME COLUMN id TO id_uuid;
        END IF;
    END$$;

-- 1.2 Add new bigint id column if missing
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='gendox_core' AND table_name='audit_logs'
              AND column_name='id' AND data_type IN ('bigint', 'integer')
        ) THEN
            ALTER TABLE gendox_core.audit_logs ADD COLUMN id BIGINT;
        END IF;
    END$$;

-- 1.3 Backfill id in chronological order (created_at, then id_uuid for tie-break)
WITH ranked AS (
    SELECT ctid,
           ROW_NUMBER() OVER (
               ORDER BY created_at NULLS LAST, id_uuid
               ) AS rn,
           (SELECT COALESCE(MAX(id),0) FROM gendox_core.audit_logs WHERE id IS NOT NULL) AS base
    FROM gendox_core.audit_logs
    WHERE id IS NULL
)
UPDATE gendox_core.audit_logs t
SET id = ranked.base + ranked.rn
FROM ranked
WHERE t.ctid = ranked.ctid;


-- 1.4 Create a sequence and attach it as default for future rows
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_class c
                              JOIN pg_namespace n ON n.oid=c.relnamespace
            WHERE c.relkind='S' AND c.relname='audit_logs_id_seq'
              AND n.nspname='gendox_core'
        ) THEN
            EXECUTE 'CREATE SEQUENCE gendox_core.audit_logs_id_seq AS BIGINT';
        END IF;
    END$$;

ALTER TABLE gendox_core.audit_logs
    ALTER COLUMN id SET DEFAULT nextval('gendox_core.audit_logs_id_seq');

-- Ensure the sequence is ahead of current max(id)
SELECT setval('gendox_core.audit_logs_id_seq',
              GREATEST( (SELECT COALESCE(MAX(id),0) FROM gendox_core.audit_logs), 0 ),
              true);

-- 1.5 Make bigint id NOT NULL
ALTER TABLE gendox_core.audit_logs
    ALTER COLUMN id SET NOT NULL;

-- 1.6 Move PRIMARY KEY to bigint id (idempotent; build index first to avoid long locks)
CREATE UNIQUE INDEX IF NOT EXISTS uidx_audit_logs_id_bigint
    ON gendox_core.audit_logs(id);

DO $$
    DECLARE pkname text;
    BEGIN
        SELECT conname INTO pkname
        FROM pg_constraint
        WHERE conrelid='gendox_core.audit_logs'::regclass AND contype='p';

        IF pkname IS NOT NULL THEN
            EXECUTE format('ALTER TABLE gendox_core.audit_logs DROP CONSTRAINT %I', pkname);
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conrelid='gendox_core.audit_logs'::regclass
              AND contype='p' AND conname='audit_logs_pkey'
        ) THEN
            ALTER TABLE gendox_core.audit_logs
                ADD CONSTRAINT audit_logs_pkey
                    PRIMARY KEY USING INDEX uidx_audit_logs_id_bigint;
        END IF;
    END$$;

ALTER SEQUENCE gendox_core.audit_logs_id_seq INCREMENT BY 50;



