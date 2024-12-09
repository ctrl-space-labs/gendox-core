INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'USER_TYPE', 'GENDOX_API_KEY', 'This is for Gendox API key users'
    WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'USER_TYPE' AND name = 'GENDOX_API_KEY'
);