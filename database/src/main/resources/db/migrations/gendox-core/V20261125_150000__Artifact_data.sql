-- Artifact data (gendox-core#600): what people do inside an artifact - a choice, a vote, a ticked box, an answer - is
-- stored as documents of the artifact, never as a new version. The artifact's code changes only when the agent changes
-- it. Safe to run again: each statement finds nothing left to do the second time.

-- What the artifact may ask the host for, as its maker declared it: "data", "user". The host gives nothing else.
ALTER TABLE gendox_core.artifacts
    ADD COLUMN IF NOT EXISTS capabilities JSONB;

COMMENT ON COLUMN gendox_core.artifacts.capabilities
    IS 'What the artifact may ask the host for, a JSON list such as ["data", "user"]; null for nothing';

CREATE TABLE IF NOT EXISTS gendox_core.artifact_data
(
    id          UUID      NOT NULL DEFAULT uuid_generate_v4(),
    artifact_id UUID      NOT NULL,
    collection  TEXT      NOT NULL,
    doc_id      TEXT      NOT NULL,
    data        JSONB     NOT NULL,
    private_to  UUID,
    revision    INTEGER   NOT NULL DEFAULT 1,
    created_at  TIMESTAMP NOT NULL,
    created_by  UUID      NOT NULL,
    updated_at  TIMESTAMP,
    updated_by  UUID,
    PRIMARY KEY (id),
    CONSTRAINT fk_artifact_data_artifact FOREIGN KEY (artifact_id) REFERENCES gendox_core.artifacts (id) ON DELETE CASCADE
);

COMMENT ON TABLE gendox_core.artifact_data
    IS 'Documents an artifact wrote, grouped in collections; the artifact decides their shape. They belong to the artifact, not to a version.';
COMMENT ON COLUMN gendox_core.artifact_data.data
    IS 'The document as the artifact wrote it; written by users, so it is only ever shown as text and read as data';
COMMENT ON COLUMN gendox_core.artifact_data.private_to
    IS 'Null: everyone who can see the artifact reads it. A user id: only that user reads and writes it. A plain id, with no foreign key.';
COMMENT ON COLUMN gendox_core.artifact_data.revision
    IS 'Raised on every write; a write that names an older revision is refused as a conflict';

-- one shared document per key, and one private document per key and person
CREATE UNIQUE INDEX IF NOT EXISTS uq_artifact_data_shared
    ON gendox_core.artifact_data (artifact_id, collection, doc_id) WHERE private_to IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_artifact_data_private
    ON gendox_core.artifact_data (artifact_id, collection, doc_id, private_to) WHERE private_to IS NOT NULL;

-- a collection's list, the last changed last
CREATE INDEX IF NOT EXISTS ix_artifact_data_collection
    ON gendox_core.artifact_data (artifact_id, collection, updated_at);
