CREATE SCHEMA IF NOT EXISTS gendox_core;

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
    id             bigserial    NOT NULL,
    name           VARCHAR(255),
    email          VARCHAR(255) NOT NULL UNIQUE,
    phone          VARCHAR(20),
    global_role_id bigint       NOT NULL, --This is the global role, indicating Simple User, Super Admin etc.
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
    id           bigserial    NOT NULL,
    name         VARCHAR(255) NOT NULL UNIQUE, -- A unique name for the organization like "ctrl-space-labs"
    display_name VARCHAR(255),                 -- A display name for the organization like "Ctrl+Space Labs"
    address      VARCHAR(255),
    phone        VARCHAR(255),
    PRIMARY KEY (id)
);

create table if not exists gendox_core.role_permission
(
    id            bigserial not null,
    role_id       bigint    not null,
    permission_id bigint    not null,
    primary key (id),
    foreign key (role_id) references gendox_core.types (id),
    foreign key (permission_id) references gendox_core.types (id)
);


-- Organization members
CREATE TABLE if not exists gendox_core.user_organization
(
    id                   bigserial NOT NULL,
    user_id              bigint    NOT NULL,
    organization_id      bigint    NOT NULL,
    organization_role_id bigint    NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES gendox_core.users (id),
    FOREIGN KEY (organization_id) REFERENCES gendox_core.organizations (id),
    FOREIGN KEY (organization_role_id) REFERENCES gendox_core.types (id)
);


-- create table document_template if not exists
CREATE TABLE IF NOT EXISTS gendox_core.document_template
(
    id              BIGSERIAL,
    name            TEXT   NOT NULL,
    description     TEXT,
    organization_id BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    created_at      timestamp,
    updated_at      timestamp,
    PRIMARY KEY (id),
    FOREIGN KEY (organization_id) REFERENCES gendox_core.organizations (id),
    FOREIGN KEY (user_id) REFERENCES gendox_core.users (id)
);

comment on column gendox_core.document_template.user_id is 'The user that created the form template';
comment on column gendox_core.document_template.organization_id is 'the organization that owns this template';

-- A Document Sections is a section of a document template
-- It indicates the type of the document section, the title, the description for this section and the order of the field
-- If there is no template for the document then the document section is a section of a document indicating just the type
CREATE TABLE IF NOT EXISTS gendox_core.document_section_template
(
    id                     BIGSERIAL,
    document_template_id   BIGINT, -- optional, if null then it is a section for a document without a Template
    document_field_type_id BIGINT  NOT NULL,
    title                  TEXT,
    description            TEXT,
    field_options          TEXT,
    field_order            INTEGER NOT NULL,
    created_at             timestamp,
    updated_at             timestamp,
    PRIMARY KEY (id),
    FOREIGN KEY (document_field_type_id) REFERENCES gendox_core.types (id),
    FOREIGN KEY (document_template_id) REFERENCES gendox_core.document_template (id)
);

comment on table gendox_core.document_section_template is 'A Document Sections is a section of a document template \n It indicates the type of the document section, the title, the description for this section and the order of the field \n If there is no template for the document then the document section is a section of a document indicating just the type';


comment on column gendox_core.document_section_template.field_options is 'If the field is a multi select field the options will go inside seperated by "option";"option"';


CREATE TABLE IF NOT EXISTS gendox_core.document_instance
(
    id                   BIGSERIAL,
    document_template_id bigint,
    user_id              bigint not null,
    created_at           timestamp,
    updated_at           timestamp,
    PRIMARY KEY (id),
    FOREIGN KEY (document_template_id) REFERENCES gendox_core.document_template (id),
    FOREIGN KEY (user_id) REFERENCES gendox_core.users (id)
);

comment on column gendox_core.document_instance.user_id is 'user that submitted the form';


CREATE TABLE IF NOT EXISTS gendox_core.form_instance_fields
(
    id                           BIGSERIAL,
    document_instance_id         bigint not null,
    document_section_template_id bigint not null,
    field_value                  text,
    remote_url                   text,
    created_at                   timestamp,
    updated_at                   timestamp,
    PRIMARY KEY (id),
    FOREIGN KEY (document_instance_id) REFERENCES gendox_core.document_instance (id),
    FOREIGN KEY (document_section_template_id) REFERENCES gendox_core.document_section_template (id)
);

comment on column gendox_core.form_instance_fields.field_value is 'the value of the field, if the field is a multi select field the values will go inside seperated by "value";"value"';
comment on column gendox_core.form_instance_fields.remote_url is 'if the value of the field is too big, the url will be stored here to retrieve the answer from the server';

