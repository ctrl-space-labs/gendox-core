ALTER TABLE IF EXISTS gendox_core.project_agent
    ADD COLUMN IF NOT EXISTS document_splitter_type bigint NOT NULL,
    ADD COLUMN IF NOT EXISTS chat_template_type bigint NOT NULL,
    ADD COLUMN IF NOT EXISTS section_template_type bigint NOT NULL,
    ADD FOREIGN KEY (document_splitter_type) REFERENCES gendox_core.types (id),
    ADD FOREIGN KEY (chat_template_type) REFERENCES gendox_core.types (id),
    ADD FOREIGN KEY (section_template_type) REFERENCES gendox_core.types (id);


INSERT into gendox_core.types
(type_category, name, description)
select 'DOCUMENT_SPLITTER_TYPE', 'STATIC_WORD_COUNT_SPLITTER', 'This is the static count splitter'
    where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'DOCUMENT_SPLITTER_TYPE'
                   and name = 'STATIC_WORD_COUNT_SPLITTER');
INSERT into gendox_core.types
(type_category, name, description)
select 'CHAT_TEMPLATE_TYPE', 'SIMPLE_TEMPLATE', 'This is a simple template'
    where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'CHAT_TEMPLATE_TYPE'
                   and name = 'SIMPLE_TEMPLATE');

INSERT into gendox_core.types
(type_category, name, description)
select 'SECTION_TEMPLATE_TYPE', 'SIMPLE_TEMPLATE', 'This is a simple template'
    where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'SECTION_TEMPLATE_TYPE'
                   and name = 'SIMPLE_TEMPLATE');