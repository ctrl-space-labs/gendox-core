-- Check if the column needs to be renamed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'wallet_keys'
        AND column_name = 'private_key'
    ) THEN
        -- Rename the column from private_key to local_key
        ALTER TABLE gendox_core.wallet_keys
        RENAME COLUMN private_key TO local_key;
    END IF;
END $$;

-- Add column jwk_key_format if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'wallet_keys'
        AND column_name = 'jwk_key_format'
    ) THEN
        ALTER TABLE gendox_core.wallet_keys
        ADD COLUMN jwk_key_format TEXT;
    END IF;
END $$;
