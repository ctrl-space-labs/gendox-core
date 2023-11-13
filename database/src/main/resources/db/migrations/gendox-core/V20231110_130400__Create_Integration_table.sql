-- Insert user types if they don't exist
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'INTEGRATION_TYPE', 'GIT_INTEGRATION', 'This is an integration for a GitHub repository'
    WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'INTEGRATION_TYPE' AND name = 'GIT_INTEGRATION'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'INTEGRATION_TYPE', 'DROPBOX_INTEGRATION', 'This is an integration for a Dropbox file'
    WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'INTEGRATION_TYPE' AND name = 'DROPBOX_INTEGRATION'
);
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'INTEGRATION_TYPE', 'GOOGLE_DRIVE_INTEGRATION', 'This is an integration for a Google Drive file'
    WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'INTEGRATION_TYPE' AND name = 'GOOGLE_DRIVE_INTEGRATION'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'INTEGRATION_TYPE', 'AWS_S3_INTEGRATION', 'This is an integration for a AWS s3 file'
    WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'INTEGRATION_TYPE' AND name = 'AWS_S3_INTEGRATION'
);

create table if not exists gendox_core.integrations
(
    id         bigserial not null,
    type_id    bigint    not null,
    agent_id uuid        not null,
    is_active boolean,
    url string,
    user_name string,
    paswword string,
    created_at    timestamp,
    updated_at    timestamp,
    created_by uuid,
    updated_by uuid,
    primary key (id),
    FOREIGN KEY (type) REFERENCES gendox_core.types (id),
    FOREIGN KEY (agent_id) REFERENCES gendox_core.project_agent (id),
    FOREIGN KEY(created_by) REFERENCES gendox_core.users(id),
    FOREIGN KEY(updated_by) REFERENCES gendox_core.users(id)
);