-- Shared artifacts: an artifact is shared with its agent or it is not. Every member of the agent sees it and may
-- have it changed, from a conversation of their own opened on it, unless the owner locked it. The owner is a member
-- of the conversation it was made in.

ALTER TABLE IF EXISTS gendox_core.artifacts
    ADD COLUMN IF NOT EXISTS shared_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS shared_by UUID,
    ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS locked_by UUID;

COMMENT ON COLUMN gendox_core.artifacts.shared_at
    IS 'When the owner shared it with every member of the agent, by shared_by; NULL while it is the owner''s alone.';
COMMENT ON COLUMN gendox_core.artifacts.locked_at
    IS 'When the owner locked it, by locked_by: the others still see it and write its data, but cannot change its code. NULL while unlocked.';

-- the agent's shared artifacts, the last changed first
CREATE INDEX IF NOT EXISTS ix_artifacts_project_shared
    ON gendox_core.artifacts (project_id, updated_at DESC) WHERE shared_at IS NOT NULL;


-- The conversations opened on an artifact that was not made in them: a member's own conversation on a shared one.
-- thread_id is a plain id, with no foreign key, so artifacts and what hangs on them can later move to a service of
-- their own; conversations are only ever deactivated, never deleted.

CREATE TABLE IF NOT EXISTS gendox_core.artifact_threads
(
    id          UUID      NOT NULL DEFAULT uuid_generate_v4(),
    artifact_id UUID      NOT NULL,
    thread_id   UUID      NOT NULL,
    created_at  TIMESTAMP NOT NULL,
    created_by  UUID      NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_artifact_threads_artifact_thread UNIQUE (artifact_id, thread_id),
    CONSTRAINT fk_artifact_threads_artifact FOREIGN KEY (artifact_id) REFERENCES gendox_core.artifacts (id) ON DELETE CASCADE
    );

COMMENT ON TABLE gendox_core.artifact_threads
    IS 'A conversation opened on an artifact made elsewhere. Its tools reach the artifact while it stays shared and the user stays a member of the agent.';

CREATE INDEX IF NOT EXISTS ix_artifact_threads_thread_id ON gendox_core.artifact_threads (thread_id);


