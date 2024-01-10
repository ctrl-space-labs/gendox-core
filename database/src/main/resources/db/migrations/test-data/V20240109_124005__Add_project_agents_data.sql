INSERT INTO gendox_core.project_agent
    (id,project_id, semantic_search_model_id, completion_model_id, agent_name, created_at, updated_at,
    document_splitter_type, max_token, temperature, top_p)
SELECT  '7d43bc6c-5365-4051-b7ff-f068b4f5b182',
        (SELECT id
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
--
--
INSERT INTO gendox_core.project_agent
    (id,project_id, semantic_search_model_id, completion_model_id, agent_name, created_at, updated_at,
    document_splitter_type, max_token, temperature, top_p)
SELECT  'bcf3111a-d448-4de1-8bff-d8f59262318b',
        (SELECT id
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
--
INSERT INTO gendox_core.project_agent
    (id,project_id, semantic_search_model_id, completion_model_id, agent_name, created_at, updated_at,
    document_splitter_type, max_token, temperature, top_p)
SELECT  'e2f66d7c-01dd-4ae0-8b12-5f12da601122',
        (SELECT id
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
--
INSERT INTO gendox_core.project_agent
    (id,project_id, semantic_search_model_id, completion_model_id, agent_name, created_at, updated_at,
    document_splitter_type, max_token, temperature, top_p)
SELECT  '2c29b1ca-e8a7-4fd7-9782-cfc59394abfe',
        (SELECT id
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