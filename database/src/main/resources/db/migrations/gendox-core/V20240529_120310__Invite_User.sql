CREATE TABLE IF NOT EXISTS gendox_core.invitations
(
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invitee_email     TEXT      NOT NULL,
    organization_id   UUID,
    user_role_type_id BIGINT,
    token             TEXT      NOT NULL,
    expires_at        TIMESTAMP NOT NULL,
    inviter_user_id   UUID,
    status_type_id    BIGINT,
    created_at        TIMESTAMP,
    updated_at        TIMESTAMP,
    created_by        UUID,
    updated_by        UUID,
    FOREIGN KEY (user_role_type_id) REFERENCES gendox_core.types (id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES gendox_core.organizations (id) ON DELETE CASCADE,
    FOREIGN KEY (inviter_user_id) REFERENCES gendox_core.users (id) ON DELETE CASCADE,
    FOREIGN KEY (status_type_id) REFERENCES gendox_core.types (id) ON DELETE CASCADE
);

DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM   pg_class c
                       JOIN   pg_namespace n ON n.oid = c.relnamespace
            WHERE  c.relname = 'idx_invitations_email'
              AND    n.nspname = 'gendox_core'
        ) THEN
            CREATE INDEX idx_invitations_email
                ON gendox_core.invitations (invitee_email);
        END IF;
    END
$$;


-- insert invitation types
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'USER_INVITATION_STATUS', 'PENDING', 'The invitation is pending for acceptance'
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'USER_INVITATION_STATUS' AND name = 'PENDING'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'USER_INVITATION_STATUS', 'ACCEPTED', 'The invitation has been accepted'
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'USER_INVITATION_STATUS' AND name = 'ACCEPTED'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'USER_INVITATION_STATUS', 'REJECTED', 'The invitation has been rejected'
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'USER_INVITATION_STATUS' AND name = 'REJECTED'
);


