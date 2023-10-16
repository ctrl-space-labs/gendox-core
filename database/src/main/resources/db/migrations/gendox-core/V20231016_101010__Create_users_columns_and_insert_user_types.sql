-- Create columns if they don't exist
ALTER TABLE gendox_core.users
    ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS user_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS users_type_id bigint,
    ADD FOREIGN KEY (users_type_id) REFERENCES gendox_core.types (id);



-- Insert user types if they don't exist
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'USER_TYPE', 'GENDOX_USER', 'This user is from Gendox'
    WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'USER_TYPE' AND name = 'GENDOX_USER'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'USER_TYPE', 'DISCORD_USER', 'This user is from Discord'
    WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'USER_TYPE' AND name = 'DISCORD_USER'
);

-- Update users to add default values to users_type_id
UPDATE gendox_core.users
SET users_type_id = (
    SELECT id
    FROM gendox_core.types
    WHERE type_category = 'USER_TYPE' AND name = 'GENDOX_USER'
    LIMIT 1
    )
WHERE email IS NOT NULL;

UPDATE gendox_core.users
SET users_type_id = (
    SELECT id
    FROM gendox_core.types
    WHERE type_category = 'USER_TYPE' AND name = 'DISCORD_USER'
    LIMIT 1
    )
WHERE user_name IS NOT NULL;
