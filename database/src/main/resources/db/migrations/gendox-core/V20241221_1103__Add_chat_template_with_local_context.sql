

INSERT INTO gendox_core.templates
(name, text, type, is_default)
SELECT
    'CHAT_CONTEXT_WITH_SESSION_AND_RETRIVAL_CONTEXT',
'[Context]:
 1. [Session Context]:
    $' || '{localContexts}
"""
 - [Retrieval Context]:
    $' || '{context}

"""
[Question]: $' || '{question}',
    (SELECT id FROM gendox_core.types
     WHERE type_category = 'TEMPLATE_TYPE' AND name = 'CHAT_TEMPLATE'),
    true
WHERE NOT EXISTS (
    SELECT *
    FROM gendox_core.templates
    WHERE name = 'CHAT_CONTEXT_WITH_SESSION_AND_RETRIVAL_CONTEXT');

-- update template where type is CHAT_TEMPLATE to default false
UPDATE gendox_core.templates
SET is_default = false
WHERE name != 'CHAT_CONTEXT_WITH_SESSION_AND_RETRIVAL_CONTEXT' and type = (SELECT id FROM gendox_core.types WHERE type_category = 'TEMPLATE_TYPE' AND name = 'CHAT_TEMPLATE');



