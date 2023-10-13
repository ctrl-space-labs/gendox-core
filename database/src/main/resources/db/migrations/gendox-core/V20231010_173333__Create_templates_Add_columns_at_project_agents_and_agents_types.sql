-- Create table templates
CREATE TABLE if not exists gendox_core.templates(
    id uuid DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    text VARCHAR(255),
    type bigint NOT NULL,
    organization_id uuid,
    is_default boolean NOT NULL,
    created_at timestamp,
    updated_at timestamp,
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY(id),
    FOREIGN KEY(type) REFERENCES gendox_core.types(id),
    FOREIGN KEY(organization_id) REFERENCES gendox_core.organizations(id),
    FOREIGN KEY(created_by) REFERENCES gendox_core.users(id),
    FOREIGN KEY(updated_by) REFERENCES gendox_core.users(id)
    );



ALTER TABLE IF EXISTS gendox_core.project_agent
    ADD COLUMN IF NOT EXISTS document_splitter_type bigint,
    ADD COLUMN IF NOT EXISTS chat_template_id UUID,
    ADD COLUMN IF NOT EXISTS section_template_id UUID,
    ADD FOREIGN KEY (document_splitter_type) REFERENCES gendox_core.types (id),
    ADD FOREIGN KEY (chat_template_id) REFERENCES gendox_core.templates (id),
    ADD FOREIGN KEY (section_template_id) REFERENCES gendox_core.templates (id);


INSERT into gendox_core.types
    (type_category, name, description)
select 'DOCUMENT_SPLITTER_TYPE',
       'STATIC_WORD_COUNT_SPLITTER',
       'This is the static count splitter' where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'DOCUMENT_SPLITTER_TYPE'
                   and name = 'STATIC_WORD_COUNT_SPLITTER');

INSERT into gendox_core.types
    (type_category, name, description)
select 'TEMPLATE_TYPE',
       'CHAT_TEMPLATE',
       'This is a chat template' where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'CHAT_TEMPLATE_TYPE'
                   and name = 'SIMPLE_TEMPLATE');

INSERT into gendox_core.types
    (type_category, name, description)
select 'TEMPLATE_TYPE',
       'SECTION_TEMPLATE',
       'This is a section template' where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'SECTION_TEMPLATE_TYPE'
                   and name = 'SIMPLE_TEMPLATE');


-- insert default templates
INSERT into gendox_core.templates
    (name, text, type, is_default)
select 'Default Chat Template',
       'Context: ' || '$' || '{context}
        Question: ' || '$' || '{question}',
       (SELECT id FROM gendox_core.types WHERE type_category = 'TEMPLATE_TYPE' AND name = 'CHAT_TEMPLATE' LIMIT 1),
       true
WHERE not exists(
    SELECT *
    FROM gendox_core.templates
    WHERE is_default = true
    and name = 'Default Chat Template'
    );

INSERT into gendox_core.templates
    (name, text, type, is_default)
select 'Default Section Template',
       ' Title: ' || '$' || '{documentTitle}
                ' || '$' || '{sectionText}
                Source: ' || '$' || '{source}
                User: ' || '$' || '{user}
                ----------------
                """ ',
       (SELECT id FROM gendox_core.types WHERE type_category = 'TEMPLATE_TYPE' AND name = 'SECTION_TEMPLATE' LIMIT 1),
       true
WHERE not exists(
    SELECT *
    FROM gendox_core.templates
    WHERE is_default = true
    and name = 'Default Section Template'
    );
