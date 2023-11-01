-- Insert user types if they don't exist
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'USER_TYPE', 'GENDOX_SUPER_ADMIN', 'This is for Administrators'
    WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'USER_TYPE' AND name = 'GENDOX_SUPER_ADMIN'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'USER_TYPE', 'GENDOX_AGENT', 'This is for Gendox Agents'
    WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'USER_TYPE' AND name = 'GENDOX_AGENT'
);

-- Update users_type_id to GENDOX_SUPER_ADMIN if global_role_id matches ROLE_SUPER_ADMIN and the column exists
UPDATE gendox_core.users AS u
SET users_type_id = (
    SELECT id
    FROM gendox_core.types AS t
    WHERE t.type_category = 'USER_TYPE' AND t.name = 'GENDOX_SUPER_ADMIN'
    LIMIT 1
    )
WHERE EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'global_role_id'
    ) AND u.global_role_id IN (
    SELECT g.id
    FROM gendox_core.types AS g
    WHERE g.type_category = 'GLOBAL_APPLICATION_ROLE_TYPE' AND g.name = 'ROLE_SUPER_ADMIN'
    );





