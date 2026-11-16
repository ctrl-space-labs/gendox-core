-- Artifact shares: a thread member shows one artifact, read only and without the conversation, either to every
-- member of the agent's project (PROJECT) or to one member of the organization (USER).
-- An artifact has at most one active share (not revoked) for the project, and at most one for each user; sharing
-- again revokes the active one and adds a row, so the history of who shared what, and when it stopped, stays.

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'ARTIFACT_SHARE_AUDIENCE', 'PROJECT', 'The signed-in members of the agent''s project'
    WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types
    WHERE type_category = 'ARTIFACT_SHARE_AUDIENCE' AND name = 'PROJECT'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'ARTIFACT_SHARE_AUDIENCE', 'USER', 'One signed-in member of the organization'
    WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types
    WHERE type_category = 'ARTIFACT_SHARE_AUDIENCE' AND name = 'USER'
);

CREATE TABLE IF NOT EXISTS gendox_core.artifact_shares
(
    id                  UUID      NOT NULL DEFAULT uuid_generate_v4(),
    artifact_id         UUID      NOT NULL,
    version             INT,
    audience_type_id    BIGINT    NOT NULL,
    shared_with_user_id UUID,
    expires_at          TIMESTAMP,
    revoked_at          TIMESTAMP,
    revoked_by          UUID,
    created_at          TIMESTAMP NOT NULL,
    created_by          UUID      NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT ck_artifact_shares_version CHECK (version IS NULL OR version > 0),
    CONSTRAINT ck_artifact_shares_not_with_self CHECK (shared_with_user_id IS NULL OR shared_with_user_id <> created_by),
    CONSTRAINT fk_artifact_shares_artifact FOREIGN KEY (artifact_id) REFERENCES gendox_core.artifacts (id) ON DELETE CASCADE,
    CONSTRAINT fk_artifact_shares_version FOREIGN KEY (artifact_id, version)
    REFERENCES gendox_core.artifact_versions (artifact_id, version) ON DELETE CASCADE,
    CONSTRAINT fk_artifact_shares_audience_type FOREIGN KEY (audience_type_id) REFERENCES gendox_core.types (id),
    CONSTRAINT fk_artifact_shares_shared_with_user FOREIGN KEY (shared_with_user_id) REFERENCES gendox_core.users (id) ON DELETE CASCADE
    );

COMMENT ON COLUMN gendox_core.artifact_shares.version
    IS 'The version shown to the audience; NULL shows the latest, as the conversation changes it.';
COMMENT ON COLUMN gendox_core.artifact_shares.audience_type_id
    IS 'A type of category ARTIFACT_SHARE_AUDIENCE. PROJECT: the members of the artifact''s project, shared_with_user_id NULL. USER: shared_with_user_id, while a member of the project''s organization.';
COMMENT ON COLUMN gendox_core.artifact_shares.shared_with_user_id
    IS 'The one user who may open a USER share; NULL for a PROJECT share. The service keeps the two in step with the audience type.';
COMMENT ON COLUMN gendox_core.artifact_shares.expires_at
    IS 'When the share stops on its own; NULL for no end.';
COMMENT ON COLUMN gendox_core.artifact_shares.revoked_at
    IS 'When the share was stopped, by revoked_by; NULL while it is active.';

-- at most one active share per artifact for the whole project, and one per artifact and user
CREATE UNIQUE INDEX IF NOT EXISTS uq_artifact_shares_active_project
    ON gendox_core.artifact_shares (artifact_id) WHERE revoked_at IS NULL AND shared_with_user_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_artifact_shares_active_user
    ON gendox_core.artifact_shares (artifact_id, shared_with_user_id) WHERE revoked_at IS NULL AND shared_with_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_artifact_shares_artifact_id ON gendox_core.artifact_shares (artifact_id);
-- "Shared with you": the active shares made to one user
CREATE INDEX IF NOT EXISTS ix_artifact_shares_shared_with_user_id
    ON gendox_core.artifact_shares (shared_with_user_id) WHERE revoked_at IS NULL AND shared_with_user_id IS NOT NULL;