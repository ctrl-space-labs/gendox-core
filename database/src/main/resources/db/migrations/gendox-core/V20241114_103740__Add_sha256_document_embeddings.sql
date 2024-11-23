ALTER TABLE gendox_core.document_instance
    ADD COLUMN IF NOT EXISTS document_sha256_hash TEXT;

ALTER TABLE gendox_core.embedding_group
    ADD COLUMN IF NOT EXISTS embedding_sha256_hash TEXT;
