INSERT INTO gendox_core.project_agent
    (project_id, semantic_search_model_id, completion_model_id, agent_name, created_at, updated_at,
    document_splitter_type, chat_template_id, section_template_id, max_token, temperature, top_p)
select (select id
        from gendox_core.projects
        where name = 'Test Project 1.1'),
       '03e034d6-9da4-4444-9aa6-664cb01bf4f7',
       'abf82230-f364-4e26-adc2-489932443d07',
       'test-project-1_1 Agent'
       now(),
       now(),
       35,
       '87798f9f-2ef9-4cdf-b215-7600eb007c4a',
       'a9080424-e079-45c8-b127-7c36411e78ce',
       500,
       0.8,
       0.4
where not exists(SELECT *
                 FROM gendox_core.project_agent
                 where name = 'test-project-1_1 Agent');


INSERT INTO gendox_core.project_agent
    (project_id, semantic_search_model_id, completion_model_id, agent_name, created_at, updated_at,
    document_splitter_type, chat_template_id, section_template_id, max_token, temperature, top_p)
select (select id
        from gendox_core.projects
        where name = 'Test Project 1.2'),
       '03e034d6-9da4-4444-9aa6-664cb01bf4f7',
       'abf82230-f364-4e26-adc2-489932443d07',
       'test-project-1_2 Agent'
       now(),
       now(),
       35,
       '87798f9f-2ef9-4cdf-b215-7600eb007c4a',
       'a9080424-e079-45c8-b127-7c36411e78ce',
       500,
       0.8,
       0.4
where not exists(SELECT *
                 FROM gendox_core.project_agent
                 where name = 'test-project-1_2 Agent');


INSERT INTO gendox_core.project_agent
    (project_id, semantic_search_model_id, completion_model_id, agent_name, created_at, updated_at,
    document_splitter_type, chat_template_id, section_template_id, max_token, temperature, top_p)
select (select id
        from gendox_core.projects
        where name = 'Test Project 2.1'),
       '03e034d6-9da4-4444-9aa6-664cb01bf4f7',
       '8f8a2bea-e764-4ffb-a5ab-b3ef83db38ff',
       'test-project-2_1 Agent'
       now(),
       now(),
       35,
       '9fc25719-9fcf-4c22-bdef-b00b71b95f93',
       'a9080424-e079-45c8-b127-7c36411e78ce',
       500,
       0.8,
       0.4
where not exists(SELECT *
                 FROM gendox_core.project_agent
                 where name = 'test-project-2_1 Agent');


INSERT INTO gendox_core.project_agent
    (project_id, semantic_search_model_id, completion_model_id, agent_name, created_at, updated_at,
    document_splitter_type, chat_template_id, section_template_id, max_token, temperature, top_p)
select (select id
        from gendox_core.projects
        where name = 'Test Project 2.2'),
       '9fc25719-9fcf-4c22-bdef-b00b71b95f93',
       '8f8a2bea-e764-4ffb-a5ab-b3ef83db38ff',
       'test-project-2_2 Agent'
       now(),
       now(),
       35,
       '87798f9f-2ef9-4cdf-b215-7600eb007c4a',
       'a9080424-e079-45c8-b127-7c36411e78ce',
       500,
       0.8,
       0.4
where not exists(SELECT *
                 FROM gendox_core.project_agent
                 where name = 'test-project-2_2 Agent');