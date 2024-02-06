UPDATE gendox_core.project_agent
SET
    chat_template_id = (SELECT id FROM gendox_core.templates WHERE name = 'Default Chat Template' LIMIT 1),
    section_template_id = (SELECT id FROM gendox_core.templates WHERE name = 'Default Section Template' LIMIT 1),
    updated_at = NOW()
WHERE
    agent_name = 'test-project-1_1 Agent'
    AND NOT EXISTS (
        SELECT 1
        FROM gendox_core.project_agent
        WHERE agent_name = 'test-project-1_1 Agent'
          AND chat_template_id = (SELECT id FROM gendox_core.templates WHERE name = 'Default Chat Template' LIMIT 1)
          AND section_template_id = (SELECT id FROM gendox_core.templates WHERE name = 'Default Section Template' LIMIT 1)
    );


UPDATE gendox_core.project_agent
SET
    chat_template_id = (SELECT id FROM gendox_core.templates WHERE name = 'Default Chat Template' LIMIT 1),
    section_template_id = (SELECT id FROM gendox_core.templates WHERE name = 'Default Section Template' LIMIT 1),
    updated_at = NOW()
WHERE
    agent_name = 'test-project-1_2 Agent'
    AND NOT EXISTS (
        SELECT 1
        FROM gendox_core.project_agent
        WHERE agent_name = 'test-project-1_2 Agent'
          AND chat_template_id = (SELECT id FROM gendox_core.templates WHERE name = 'Default Chat Template' LIMIT 1)
          AND section_template_id = (SELECT id FROM gendox_core.templates WHERE name = 'Default Section Template' LIMIT 1)
    );


UPDATE gendox_core.project_agent
SET
    chat_template_id = (SELECT id FROM gendox_core.templates WHERE name = 'Default Chat Template' LIMIT 1),
    section_template_id = (SELECT id FROM gendox_core.templates WHERE name = 'Default Section Template' LIMIT 1),
    updated_at = NOW()
WHERE
    agent_name = 'test-project-2_1 Agent'
    AND NOT EXISTS (
        SELECT 1
        FROM gendox_core.project_agent
        WHERE agent_name = 'test-project-2_1 Agent'
          AND chat_template_id = (SELECT id FROM gendox_core.templates WHERE name = 'Default Chat Template' LIMIT 1)
          AND section_template_id = (SELECT id FROM gendox_core.templates WHERE name = 'Default Section Template' LIMIT 1)
    );


UPDATE gendox_core.project_agent
SET
    chat_template_id = (SELECT id FROM gendox_core.templates WHERE name = 'Default Chat Template' LIMIT 1),
    section_template_id = (SELECT id FROM gendox_core.templates WHERE name = 'Default Section Template' LIMIT 1),
    updated_at = NOW()
WHERE
    agent_name = 'test-project-2_2 Agent'
    AND NOT EXISTS (
        SELECT 1
        FROM gendox_core.project_agent
        WHERE agent_name = 'test-project-2_2 Agent'
          AND chat_template_id = (SELECT id FROM gendox_core.templates WHERE name = 'Default Chat Template' LIMIT 1)
          AND section_template_id = (SELECT id FROM gendox_core.templates WHERE name = 'Default Section Template' LIMIT 1)
    );