-- Sharing artifacts, as Claude's artifacts do. An artifact has one owner, who made it. The owner gives a role to
-- every member of the agent (general access) and to members one by one; a user's role is the higher of the two.
-- VIEW sees it, INTERACT also writes its data, EDIT also changes its code from a conversation of their own.
-- A public link opens it to anyone, signed in or not, with its shared data, read only.

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'ARTIFACT_ROLE', 'VIEW', 'Sees the artifact and its versions'
    WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types
    WHERE type_category = 'ARTIFACT_ROLE' AND name = 'VIEW'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'ARTIFACT_ROLE', 'INTERACT', 'Also uses it: writes its data, never a new version'
    WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types
    WHERE type_category = 'ARTIFACT_ROLE' AND name = 'INTERACT'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'ARTIFACT_ROLE', 'EDIT', 'Also changes its code, from a conversation of their own'
    WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types
    WHERE type_category = 'ARTIFACT_ROLE' AND name = 'EDIT'
);


ALTER TABLE IF EXISTS gendox_core.artifacts
    ADD COLUMN IF NOT EXISTS owner_id               UUID,
    ADD COLUMN IF NOT EXISTS general_access_role_id BIGINT REFERENCES gendox_core.types (id),
    ADD COLUMN IF NOT EXISTS public_id              UUID,
    ADD COLUMN IF NOT EXISTS public_at              TIMESTAMP,
    ADD COLUMN IF NOT EXISTS public_by              UUID;

COMMENT ON COLUMN gendox_core.artifacts.owner_id
    IS 'The one person who made it: only they share it, make it public and delete it. A plain id, with no foreign key.';
COMMENT ON COLUMN gendox_core.artifacts.general_access_role_id
    IS 'General access: a type of category ARTIFACT_ROLE that every member of the agent has; NULL for only the owner and the people invited.';
COMMENT ON COLUMN gendox_core.artifacts.public_id
    IS 'The id in its public link, view only for anyone, with its shared data; NULL while it is not public. A new one each time it is made public, so an old link never opens again.';

-- the owner of the artifacts made so far: the member of the conversation they were made in
UPDATE gendox_core.artifacts a
SET owner_id = (SELECT m.user_id
                FROM gendox_core.chat_thread_member m
                WHERE m.thread_id = a.thread_id AND m.user_id IS NOT NULL
                ORDER BY m.created_at
    LIMIT 1)
WHERE a.owner_id IS NULL;

CREATE INDEX IF NOT EXISTS ix_artifacts_owner_id ON gendox_core.artifacts (owner_id);
-- the artifacts shared with the whole agent, the last changed first
CREATE INDEX IF NOT EXISTS ix_artifacts_project_general_access
    ON gendox_core.artifacts (project_id, updated_at DESC) WHERE general_access_role_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_artifacts_public_id
    ON gendox_core.artifacts (public_id) WHERE public_id IS NOT NULL;


-- The members of the agent invited one by one, each with a role. The owner is not a row.

CREATE TABLE IF NOT EXISTS gendox_core.artifact_members
(
    id          UUID      NOT NULL DEFAULT uuid_generate_v4(),
    artifact_id UUID      NOT NULL,
    user_id     UUID      NOT NULL,
    role_id     BIGINT    NOT NULL,
    created_at  TIMESTAMP NOT NULL,
    created_by  UUID      NOT NULL,
    updated_at  TIMESTAMP,
    updated_by  UUID,
    PRIMARY KEY (id),
    CONSTRAINT uq_artifact_members_artifact_user UNIQUE (artifact_id, user_id),
    CONSTRAINT fk_artifact_members_artifact FOREIGN KEY (artifact_id) REFERENCES gendox_core.artifacts (id) ON DELETE CASCADE,
    CONSTRAINT fk_artifact_members_role FOREIGN KEY (role_id) REFERENCES gendox_core.types (id)
    );

COMMENT ON COLUMN gendox_core.artifact_members.user_id
    IS 'A member of the artifact''s agent; a plain id, with no foreign key. Someone who leaves the agent loses the artifact.';

-- "Shared with you"
CREATE INDEX IF NOT EXISTS ix_artifact_members_user_id ON gendox_core.artifact_members (user_id);


-- The conversations opened on an artifact that was not made in them: a member's own conversation on a shared one.
-- thread_id is a plain id, with no foreign key; conversations are only ever deactivated, never deleted.

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
    IS 'A conversation opened on an artifact made elsewhere. Its tools reach the artifact while its user may still edit it.';

CREATE INDEX IF NOT EXISTS ix_artifact_threads_thread_id ON gendox_core.artifact_threads (thread_id);