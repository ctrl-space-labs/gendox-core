-- Check if the column local_key exists before renaming it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_keys' AND column_name = 'local_key') THEN
        ALTER TABLE gendox_core.wallet_keys RENAME COLUMN local_key TO public_key;
    END IF;
END $$;

-- Check if the column jwk_key_format exists before renaming it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet_keys' AND column_name = 'jwk_key_format') THEN
        ALTER TABLE gendox_core.wallet_keys RENAME COLUMN jwk_key_format TO jwk_private_key;
    END IF;
END $$;
