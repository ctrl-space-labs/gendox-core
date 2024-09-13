-- Add the new column character_length to the wallet_keys table if it doesn't exist
ALTER TABLE gendox_core.wallet_keys
ADD COLUMN IF NOT EXISTS character_length Int; -- Adjust the data type as needed
