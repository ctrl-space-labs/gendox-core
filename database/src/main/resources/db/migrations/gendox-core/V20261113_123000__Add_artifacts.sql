-- Artifacts: standalone content an agent writes in a chat thread (a page, a diagram, a document, code).
-- An artifact belongs to one thread. Each change adds a row in artifact_versions; nothing is overwritten.

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'ARTIFACT_TYPE', 'HTML', 'A complete HTML page'
    WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types
    WHERE type_category = 'ARTIFACT_TYPE' AND name = 'HTML'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'ARTIFACT_TYPE', 'SVG', 'One SVG element: a diagram or an illustration'
    WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types
    WHERE type_category = 'ARTIFACT_TYPE' AND name = 'SVG'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'ARTIFACT_TYPE', 'MARKDOWN', 'A document that is mostly text'
    WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types
    WHERE type_category = 'ARTIFACT_TYPE' AND name = 'MARKDOWN'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'ARTIFACT_TYPE', 'CODE', 'Source code, shown highlighted and not run'
    WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types
    WHERE type_category = 'ARTIFACT_TYPE' AND name = 'CODE'
);

CREATE TABLE IF NOT EXISTS gendox_core.artifacts
(
    id               UUID   NOT NULL DEFAULT uuid_generate_v4(),
    thread_id        UUID   NOT NULL,
    project_id       UUID   NOT NULL,
    title            TEXT   NOT NULL,
    artifact_type_id BIGINT NOT NULL,
    code_language    TEXT,
    latest_version   INT    NOT NULL DEFAULT 1,
    created_at       TIMESTAMP,
    updated_at       TIMESTAMP,
    created_by       UUID,
    updated_by       UUID,
    PRIMARY KEY (id),
    CONSTRAINT fk_artifacts_thread FOREIGN KEY (thread_id) REFERENCES gendox_core.chat_thread (id) ON DELETE CASCADE,
    CONSTRAINT fk_artifacts_project FOREIGN KEY (project_id) REFERENCES gendox_core.projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_artifacts_artifact_type FOREIGN KEY (artifact_type_id) REFERENCES gendox_core.types (id)
    );

COMMENT ON COLUMN gendox_core.artifacts.artifact_type_id
    IS 'A type of category ARTIFACT_TYPE. A new kind is a new types row, with no change here.';
COMMENT ON COLUMN gendox_core.artifacts.code_language
    IS 'The programming language of the code (python, sql, ...), for type CODE only.';
COMMENT ON COLUMN gendox_core.artifacts.latest_version
    IS 'The version number of the latest row in artifact_versions. Raised in the same transaction that adds the row.';

CREATE INDEX IF NOT EXISTS ix_artifacts_thread_id ON gendox_core.artifacts (thread_id);

CREATE TABLE IF NOT EXISTS gendox_core.artifact_versions
(
    id          UUID NOT NULL DEFAULT uuid_generate_v4(),
    artifact_id UUID NOT NULL,
    version     INT  NOT NULL,
    content     TEXT NOT NULL,
    message_id  UUID,
    created_at  TIMESTAMP,
    created_by  UUID,
    PRIMARY KEY (id),
    CONSTRAINT uq_artifact_versions_artifact_version UNIQUE (artifact_id, version),
    CONSTRAINT fk_artifact_versions_artifact FOREIGN KEY (artifact_id) REFERENCES gendox_core.artifacts (id) ON DELETE CASCADE,
    CONSTRAINT fk_artifact_versions_message FOREIGN KEY (message_id) REFERENCES gendox_core.message (id) ON DELETE SET NULL
    );

COMMENT ON COLUMN gendox_core.artifact_versions.message_id
    IS 'The assistant message whose tool call wrote this version.';

CREATE INDEX IF NOT EXISTS ix_artifact_versions_artifact_id ON gendox_core.artifact_versions (artifact_id);


-- Subscription plan: whether the plan includes artifacts

ALTER TABLE IF EXISTS gendox_core.subscription_plans
    ADD COLUMN IF NOT EXISTS artifacts_enabled BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN gendox_core.subscription_plans.artifacts_enabled
    IS 'Whether agents of organizations on this plan may write artifacts. When false, the artifact tools are not offered, even to an agent that has the artifacts skill.';