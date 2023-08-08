CREATE SCHEMA IF NOT EXISTS gendox_core;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS vector;


create table if not exists gendox_core.types
(
    id            bigserial NOT NULL,
    type_category TEXT      NOT NULL,
    name          TEXT      NOT NULL,
    description   TEXT      NOT NULL,
    PRIMARY KEY (id)
);

CREATE INDEX types_type_category_name_idx ON gendox_core.types (type_category, name);
CREATE INDEX types_name_idx ON gendox_core.types (name);



CREATE TABLE IF NOT EXISTS gendox_core.users
(
    id             uuid DEFAULT uuid_generate_v4(),
    name           VARCHAR(255),
    email          VARCHAR(255) NOT NULL UNIQUE,
    phone          VARCHAR(20),
    global_role_id bigint       NOT NULL, --This is the global role, indicating Simple User, Super Admin etc.
    created_at     timestamp,
    updated_at     timestamp,
    PRIMARY KEY (id),
    FOREIGN KEY (global_role_id) REFERENCES gendox_core.types (id)
);

comment on column gendox_core.users.global_role_id is 'This is the global role, indicating Simple User, Super Admin etc.';


-- Bigserial creates a sequence and a default value for the column
-- It is equivalent to:
-- CREATE SEQUENCE table_name_id_seq;
--
-- CREATE TABLE users (
--     id integer NOT NULL DEFAULT nextval('table_name_id_seq')
-- );
--
-- ALTER SEQUENCE table_name_id_seq
--     OWNED BY table_name.id;
---------------------------------------------------------------------------------


-- -- SELECT ALL SCEMAS
-- SELECT * FROM information_schema.schemata;

CREATE TABLE IF NOT EXISTS gendox_core.organizations
(
    id           uuid DEFAULT uuid_generate_v4(),
    name         VARCHAR(255) NOT NULL UNIQUE, -- A unique name for the organization like "ctrl-space-labs"
    display_name VARCHAR(255),                 -- A display name for the organization like "Ctrl+Space Labs"
    address      VARCHAR(255),
    phone        VARCHAR(255),
    created_at   timestamp,
    updated_at   timestamp,
    PRIMARY KEY (id)
);

create table if not exists gendox_core.role_permission
(
    id            bigserial not null,
    role_id       bigint    not null,
    permission_id bigint    not null,
    created_at    timestamp,
    updated_at    timestamp,
    primary key (id),
    foreign key (role_id) references gendox_core.types (id),
    foreign key (permission_id) references gendox_core.types (id)
);


-- Organization members
CREATE TABLE if not exists gendox_core.user_organization
(
    id                   uuid DEFAULT uuid_generate_v4(),
    user_id              uuid   NOT NULL,
    organization_id      uuid   NOT NULL,
    organization_role_id bigint NOT NULL,
    created_at           timestamp,
    updated_at           timestamp,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES gendox_core.users (id),
    FOREIGN KEY (organization_id) REFERENCES gendox_core.organizations (id),
    FOREIGN KEY (organization_role_id) REFERENCES gendox_core.types (id)
);


-- create table document_template if not exists
CREATE TABLE IF NOT EXISTS gendox_core.document_template
(
    id              uuid DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    description     TEXT,
    organization_id uuid NOT NULL,
    user_id         uuid NOT NULL,
    created_at      timestamp,
    updated_at      timestamp,
    PRIMARY KEY (id),
    FOREIGN KEY (organization_id) REFERENCES gendox_core.organizations (id),
    FOREIGN KEY (user_id) REFERENCES gendox_core.users (id)
);

comment on column gendox_core.document_template.user_id is 'The user that created the document template';
comment on column gendox_core.document_template.organization_id is 'the organization that owns this template';

-- A Document Sections is a section of a document template
-- It indicates the type of the document section, the title, the description for this section and the order of the section
-- If there is no template for the document then the document section is a section of a document indicating just the type
CREATE TABLE IF NOT EXISTS gendox_core.document_section_template
(
    id                       uuid DEFAULT uuid_generate_v4(),
    document_template_id     uuid, -- optional, if null then it is a section for a document without a Template
    document_section_type_id bigint  NOT NULL,
    title                    TEXT,
    description              TEXT,
    section_options            TEXT,
    section_order              INTEGER NOT NULL,
    created_at               timestamp,
    updated_at               timestamp,
    PRIMARY KEY (id),
    FOREIGN KEY (document_section_type_id) REFERENCES gendox_core.types (id),
    FOREIGN KEY (document_template_id) REFERENCES gendox_core.document_template (id)
);

comment on table gendox_core.document_section_template is 'A Document Sections is a section of a document template \n It indicates the type of the document section, the title, the description for this section and the order of the section \n If there is no template for the document then the document section is a section of a document indicating just the type';


comment on column gendox_core.document_section_template.section_options is 'If the section is a multi select section the options will go inside seperated by "option";"option"';


CREATE TABLE IF NOT EXISTS gendox_core.document_instance
(
    id                   uuid DEFAULT uuid_generate_v4(),
    document_template_id uuid,
    user_id              uuid not null,
    created_at           timestamp,
    updated_at           timestamp,
    PRIMARY KEY (id),
    FOREIGN KEY (document_template_id) REFERENCES gendox_core.document_template (id),
    FOREIGN KEY (user_id) REFERENCES gendox_core.users (id)
);

comment on column gendox_core.document_instance.user_id is 'user that submitted the document';


CREATE TABLE IF NOT EXISTS gendox_core.document_instance_sections
(
    id                           uuid DEFAULT uuid_generate_v4(),
    document_instance_id         uuid not null,
    document_section_template_id uuid not null,
    section_value                  text,
    remote_url                   text,
    created_at                   timestamp,
    updated_at                   timestamp,
    PRIMARY KEY (id),
    FOREIGN KEY (document_instance_id) REFERENCES gendox_core.document_instance (id),
    FOREIGN KEY (document_section_template_id) REFERENCES gendox_core.document_section_template (id)
);

comment on column gendox_core.document_instance_sections.section_value is 'the value of the section, if the section is a multi select section the values will go inside seperated by "value";"value"';
comment on column gendox_core.document_instance_sections.remote_url is 'if the value of the section is too big, the url will be stored here to retrieve the answer from the server';


CREATE TABLE IF NOT EXISTS gendox_core.projects
(
    id              uuid DEFAULT uuid_generate_v4(),
    organization_id uuid NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    created_at      timestamp,
    updated_at      timestamp,
    PRIMARY KEY (id),
    FOREIGN KEY (organization_id) REFERENCES gendox_core.organizations (id)
);

CREATE TABLE IF NOT EXISTS gendox_core.project_members
(
    id         uuid DEFAULT uuid_generate_v4(),
    project_id uuid NOT NULL,
    user_id    uuid NOT NULL,
    created_at timestamp,
    updated_at timestamp,
    PRIMARY KEY (id),
    FOREIGN KEY (project_id) REFERENCES gendox_core.projects (id),
    FOREIGN KEY (user_id) REFERENCES gendox_core.users (id)
);

CREATE TABLE IF NOT EXISTS gendox_core.project_documents
(
    id          uuid DEFAULT uuid_generate_v4(),
    project_id  uuid NOT NULL,
    document_id uuid NOT NULL,
    created_at  timestamp,
    updated_at  timestamp,
    PRIMARY KEY (id),
    FOREIGN KEY (project_id) REFERENCES gendox_core.projects (id),
    FOREIGN KEY (document_id) REFERENCES gendox_core.document_instance (id)
);

-- project - template
CREATE TABLE IF NOT EXISTS gendox_core.project_templates
(
    id          uuid DEFAULT uuid_generate_v4(),
    project_id  uuid NOT NULL,
    template_id uuid NOT NULL,
    created_at  timestamp,
    updated_at  timestamp,
    PRIMARY KEY (id),
    FOREIGN KEY (project_id) REFERENCES gendox_core.projects (id),
    FOREIGN KEY (template_id) REFERENCES gendox_core.document_template (id)
);

-- AI models are supported by the system they nave name,url, type,api_key, price per token
CREATE TABLE IF NOT EXISTS gendox_core.ai_models
(
    id         uuid DEFAULT uuid_generate_v4(),
    name       TEXT            NOT NULL,
    url        TEXT,
    type       TEXT,                     -- Completion, Embedding, Classification etc
    api_key    TEXT,
    price      DECIMAL(18, 12) NOT NULL, --per 1000 tokens
    created_at timestamp,
    updated_at timestamp,
    PRIMARY KEY (id)
);
comment on table gendox_core.ai_models is 'AI models that are supported by the system. It can be ChatGPT, Ada 2, LLama v2, gte-large, etc';
comment on column gendox_core.ai_models.price is 'Price per 1000 tokens';

-- Each project has an AI Agent, the user can define the behavior of the agent
CREATE TABLE IF NOT EXISTS gendox_core.project_agent
(
    id                       uuid    DEFAULT uuid_generate_v4(),
    project_id               uuid NOT NULL,
    semantic_search_model_id uuid,
    completion_model_id      uuid,
    agent_name               TEXT NOT NULL,
    agent_behavior           TEXT,
    private                  boolean default true,
    created_at               timestamp,
    updated_at               timestamp,
    PRIMARY KEY (id),
    FOREIGN KEY (project_id) REFERENCES gendox_core.projects (id),
    FOREIGN KEY (semantic_search_model_id) REFERENCES gendox_core.ai_models (id),
    FOREIGN KEY (completion_model_id) REFERENCES gendox_core.ai_models (id)
);

comment on table gendox_core.project_agent is 'Each project has an AI Agent, the user can define the behavior of the agent, and the models to be used';

-- Message logs will be stored that will count the number of tokens sent by and to the agent
-- The user will be charged based on the number of tokens used
CREATE TABLE IF NOT EXISTS gendox_core.message_logs
(
    id          uuid DEFAULT uuid_generate_v4(),
    project_id  uuid NOT NULL,
    user_id     uuid NOT NULL,
    request_id  uuid, --The UUID of the request that was sent to the API by the user
    token_count bigint,
    type        TEXT, -- completion input, completion output, semantic search input, training input etc
    created_at  timestamp,
    updated_at  timestamp,
    PRIMARY KEY (id),
    FOREIGN KEY (project_id) REFERENCES gendox_core.projects (id),
    FOREIGN KEY (user_id) REFERENCES gendox_core.users (id)
);

comment on column gendox_core.message_logs.request_id is 'The UUID of the request that was sent to the API by the user';

