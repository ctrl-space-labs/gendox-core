-- Two permissions for integrations
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'ORGANIZATION_ROLE_PERMISSION_TYPE',
       'OP_READ_INTEGRATIONS',
       'Permission to read the integrations of an organization'
    WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE'
                    AND name = 'OP_READ_INTEGRATIONS');

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'ORGANIZATION_ROLE_PERMISSION_TYPE',
       'OP_EDIT_INTEGRATIONS',
       'Permission to create, change and remove the integrations of an organization'
    WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE'
                    AND name = 'OP_EDIT_INTEGRATIONS');


-- Four role permissions
INSERT INTO gendox_core.role_permission (role_id, permission_id)
SELECT r.id AS role_id, p.id AS permission_id
FROM gendox_core.types r,
     gendox_core.types p
WHERE r.type_category = 'ORGANIZATION_ROLE_TYPE'
  AND r.name IN ('ROLE_ADMIN', 'ROLE_OWNER')
  AND p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE'
  AND p.name IN ('OP_READ_INTEGRATIONS', 'OP_EDIT_INTEGRATIONS')
  AND NOT EXISTS (SELECT 1
                  FROM gendox_core.role_permission
                  WHERE role_id = r.id
                    AND permission_id = p.id);