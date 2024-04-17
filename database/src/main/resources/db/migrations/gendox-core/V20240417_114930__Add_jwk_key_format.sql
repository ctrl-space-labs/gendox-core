--i need to rename the column of wallet_key private_key to local_key also add a column to store the jwk format of the key
ALTER TABLE gendox_core.wallet_keys
RENAME COLUMN private_key TO local_key;

ALTER TABLE gendox_core.wallet_keys
ADD COLUMN IF NOT EXISTS jwk_key_format TEXT;