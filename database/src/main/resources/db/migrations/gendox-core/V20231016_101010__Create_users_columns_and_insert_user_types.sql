-- Create columns if they don't exist
ALTER TABLE gendox_core.users
    ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'gendox_core'
        AND table_name = 'users'
        AND column_name = 'users_type_id'
    ) THEN
        ALTER TABLE gendox_core.users
        ADD COLUMN users_type_id bigint,
        ADD FOREIGN KEY (users_type_id) REFERENCES gendox_core.types (id);
    END IF;
END $$;



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

-- Remove the existing unique constraint
ALTER TABLE gendox_core.users
DROP CONSTRAINT IF EXISTS users_email_key;

-- Then, delete the NOT NULL constraint to the email column
ALTER TABLE gendox_core.users
    ALTER COLUMN email DROP NOT NULL;

-- Add a unique index that includes non-NULL values only
CREATE UNIQUE INDEX users_email_unique ON gendox_core.users(email) WHERE email IS NOT NULL;