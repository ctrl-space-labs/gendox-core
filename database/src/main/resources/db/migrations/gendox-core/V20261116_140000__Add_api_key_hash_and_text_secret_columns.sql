-- SEC-1, secrets at rest.
-- Every statement can run again on a database that already has the change.

-- A presented API key is looked up by its hash. The key column itself is encrypted
-- by the application and cannot be searched.
ALTER TABLE gendox_core.api_keys
    ADD COLUMN IF NOT EXISTS api_key_hash varchar(64);

UPDATE gendox_core.api_keys
SET api_key_hash = encode(sha256(convert_to(api_key, 'UTF8')), 'hex')
WHERE api_key_hash IS NULL;

ALTER TABLE gendox_core.api_keys
    ALTER COLUMN api_key_hash SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_api_keys_api_key_hash
    ON gendox_core.api_keys (api_key_hash);

-- An encrypted value is longer than the secret it holds, so the columns are text.
-- organization_connectors.config stays jsonb: its encrypted value is stored as a JSON string.
ALTER TABLE gendox_core.api_keys
    ALTER COLUMN api_key TYPE text;

ALTER TABLE gendox_core.organization_model_provider_keys
    ALTER COLUMN key TYPE text;

-- The audit entry written when a member reveals an API key in full
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AUDIT_LOG_TYPE', 'API_KEY_REVEAL', 'A member revealed an API key in full.'
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types
    WHERE type_category = 'AUDIT_LOG_TYPE' AND name = 'API_KEY_REVEAL'
);
