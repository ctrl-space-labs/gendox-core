INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'KEY_TYPE', 'RSA', 'RSA Key Type'
WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'KEY_TYPE'
                    AND name = 'RSA');

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'KEY_TYPE', 'ECDSA_SECP256K1', 'ECDSA secp256k1 Key Type'
WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'KEY_TYPE'
                    AND name = 'ECDSA_SECP256K1');

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'KEY_TYPE', 'ECDSA_SECP256R1', 'ECDSA secp256r1 Key Type'
WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'KEY_TYPE'
                    AND name = 'ECDSA_SECP256R1');

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'KEY_TYPE', 'EDDSA_ED25519', 'EdDSA Ed25519 Key Type'
WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'KEY_TYPE'
                    AND name = 'EDDSA_ED25519');
