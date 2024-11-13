-- Create table to store API keys for organizations

CREATE TABLE IF NOT EXISTS gendox_core.api_keys
(
    id uuid DEFAULT uuid_generate_v4(),
    organization_id uuid not null,
    name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id),
    foreign key (organization_id) references gendox_core.organizations(id)
);

comment on table gendox_core.api_keys is 'Table to store API keys for organizations';


-- Create columns if they don't exist
ALTER TABLE gendox_core.api_keys
    ADD COLUMN IF NOT EXISTS start_date TIMESTAMP;

ALTER TABLE gendox_core.api_keys
    ADD COLUMN IF NOT EXISTS end_date TIMESTAMP;

ALTER TABLE gendox_core.api_keys
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN;


-- Insert default permissions for API keys

INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_READ_API_KEYS', 'Permission to read API Keys'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE'
                   and name = 'OP_READ_API_KEYS');


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_READ_API_KEYS'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_EDIT_API_KEYS', 'Permission to edit API Keys'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE'
                   and name = 'OP_EDIT_API_KEYS');


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_EDIT_API_KEYS'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);