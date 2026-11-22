-- Agent platform roadmap: the schema changes of #550/#559, #561 and #592, and the unaccent fix.
-- Every statement can run again on a database that already has the change.

-- #550 #559: a retrieved section names its file in one line (path, last modified, id), the way every tool does.
UPDATE gendox_core.templates
SET text = replace(text,
                   'Title: ' || '$' || '{documentTitle}',
                   'File: ' || '$' || '{file}')
WHERE name = 'Default Section Template';

-- Name search calls unaccent() without a schema, so the extension belongs in public (as uuid-ossp, V20240419_131410).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'unaccent') THEN
        CREATE EXTENSION unaccent SCHEMA public;
    ELSIF (SELECT extnamespace::regnamespace::text FROM pg_extension WHERE extname = 'unaccent') <> 'public' THEN
        ALTER EXTENSION unaccent SET SCHEMA public;
    END IF;
END
$$;

-- #561 (SEC-1): a presented API key is found by its hash; nullable so older code can still create keys.
ALTER TABLE gendox_core.api_keys
    ADD COLUMN IF NOT EXISTS api_key_hash varchar(64);

-- #561 (SEC-1): hash the keys still stored as plain text; the application fills any later ones (ApiKeyService#fillMissingHashes).
UPDATE gendox_core.api_keys
SET api_key_hash = encode(sha256(convert_to(api_key, 'UTF8')), 'hex')
WHERE api_key_hash IS NULL
  AND api_key NOT LIKE 'enc:%';

-- #561 (SEC-1)
CREATE INDEX IF NOT EXISTS idx_api_keys_api_key_hash
    ON gendox_core.api_keys (api_key_hash);

-- #561 (SEC-1): an encrypted value is longer than its secret, so these columns are text.
ALTER TABLE gendox_core.api_keys
    ALTER COLUMN api_key TYPE text;

ALTER TABLE gendox_core.organization_model_provider_keys
    ALTER COLUMN key TYPE text;

-- #561 (SEC-1): the audit entry written when a member reveals an API key in full.
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AUDIT_LOG_TYPE', 'API_KEY_REVEAL', 'A member revealed an API key in full.'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types
    WHERE type_category = 'AUDIT_LOG_TYPE' AND name = 'API_KEY_REVEAL'
);

-- #592 (APPR-1): ask the user before a CLIENT or ACTION tool call runs; a declined call runs nothing.
ALTER TABLE gendox_core.ai_tools
    ADD COLUMN IF NOT EXISTS requires_approval boolean NOT NULL DEFAULT false;
