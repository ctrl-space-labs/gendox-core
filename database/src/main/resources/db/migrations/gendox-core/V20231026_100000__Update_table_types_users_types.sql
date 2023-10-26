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