INSERT INTO gendox_core.project_agent
    (project_id, semantic_search_model_id, completion_model_id, agent_name, created_at, updated_at,
    document_splitter_type, max_token, temperature, top_p)
SELECT (SELECT id
        FROM gendox_core.projects
        WHERE name = 'Test Project 1.1'),
       (SELECT id
        FROM gendox_core.ai_models
        WHERE model = 'embed-multilingual-v3.0'
        LIMIT 1),
       (SELECT id
        FROM gendox_core.ai_models
        WHERE model = 'command'
        LIMIT 1),
       'test-project-1_1 Agent',
       now(),
       now(),
       35,
       500,
       0.8,
       0.4
WHERE NOT EXISTS(SELECT *
                 FROM gendox_core.project_agent
                 WHERE agent_name = 'test-project-1_1 Agent');


INSERT INTO gendox_core.project_agent
    (project_id, semantic_search_model_id, completion_model_id, agent_name, created_at, updated_at,
    document_splitter_type, max_token, temperature, top_p)
SELECT (SELECT id
        FROM gendox_core.projects
        WHERE name = 'Test Project 1.2'),
       (SELECT id
        FROM gendox_core.ai_models
        WHERE model = 'text-embedding-ada-002'
        LIMIT 1),
       (SELECT id
        FROM gendox_core.ai_models
        WHERE model = 'command'
        LIMIT 1),
       'test-project-1_2 Agent',
       now(),
       now(),
       35,
       500,
       0.8,
       0.4
WHERE NOT EXISTS(SELECT *
                 FROM gendox_core.project_agent
                 WHERE agent_name = 'test-project-1_2 Agent');

INSERT INTO gendox_core.project_agent
    (project_id, semantic_search_model_id, completion_model_id, agent_name, created_at, updated_at,
    document_splitter_type, max_token, temperature, top_p)
SELECT (SELECT id
        FROM gendox_core.projects
        WHERE name = 'Test Project 2.1'),
       (SELECT id
        FROM gendox_core.ai_models
        WHERE model = 'text-embedding-ada-002'
        LIMIT 1),
       (SELECT id
        FROM gendox_core.ai_models
        WHERE model = 'gpt-4'
        LIMIT 1),
       'test-project-2_1 Agent',
       now(),
       now(),
       35,
       500,
       0.8,
       0.4
WHERE NOT EXISTS(SELECT *
                 FROM gendox_core.project_agent
                 WHERE agent_name = 'test-project-2_1 Agent');

INSERT INTO gendox_core.project_agent
    (project_id, semantic_search_model_id, completion_model_id, agent_name, created_at, updated_at,
    document_splitter_type, max_token, temperature, top_p)
SELECT (SELECT id
        FROM gendox_core.projects
        WHERE name = 'Test Project 2.2'),
       (SELECT id
        FROM gendox_core.ai_models
        WHERE model = 'embed-multilingual-v3.0'
        LIMIT 1),
       (SELECT id
        FROM gendox_core.ai_models
        WHERE model = 'gpt-3.5-turbo'
        LIMIT 1),
       'test-project-2_2 Agent',
       now(),
       now(),
       35,
       500,
       0.8,
       0.4
WHERE NOT EXISTS(SELECT *
                 FROM gendox_core.project_agent
                 WHERE agent_name = 'test-project-2_2 Agent');