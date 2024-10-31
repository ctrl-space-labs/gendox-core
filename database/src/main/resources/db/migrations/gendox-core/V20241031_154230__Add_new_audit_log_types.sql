INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AUDIT_LOG_TYPE', 'COMPLETION_RESPONSE', 'This is for completion response auditing.'
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'AUDIT_LOG_TYPE' AND name = 'COMPLETION_RESPONSE'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AUDIT_LOG_TYPE', 'DELETE_ORGANIZATION', 'This is for delete organization auditing.'
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'AUDIT_LOG_TYPE' AND name = 'DELETE_ORGANIZATION'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AUDIT_LOG_TYPE', 'DELETE_PROJECT', 'This is for delete project auditing.'
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'AUDIT_LOG_TYPE' AND name = 'DELETE_PROJECT'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AUDIT_LOG_TYPE', 'DELETE_USER', 'This is for delete user auditing.'
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'AUDIT_LOG_TYPE' AND name = 'DELETE_USER'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AUDIT_LOG_TYPE', 'DOCUMENT_CREATE', 'This is for create or upload document auditing.'
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'AUDIT_LOG_TYPE' AND name = 'DOCUMENT_CREATE'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AUDIT_LOG_TYPE', 'DOCUMENT_UPDATE', 'This is for update document auditing.'
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'AUDIT_LOG_TYPE' AND name = 'DOCUMENT_UPDATE'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AUDIT_LOG_TYPE', 'DOCUMENT_DELETE', 'This is for delete document auditing.'
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'AUDIT_LOG_TYPE' AND name = 'DOCUMENT_DELETE'
);

