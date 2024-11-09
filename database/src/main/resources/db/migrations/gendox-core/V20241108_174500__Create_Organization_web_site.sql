-- Create table to store organization web sites

CREATE TABLE IF NOT EXISTS gendox_core.organization_web_sites (
    id uuid DEFAULT uuid_generate_v4(),
    organization_id uuid not null,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id),
    foreign key (organization_id) references gendox_core.organizations(id)
);

comment on table gendox_core.organization_web_sites is 'Table to store organization web sites';


-- Create columns if they don't exist
ALTER TABLE gendox_core.subscription_plans
    ADD COLUMN IF NOT EXISTS organization_web_sites integer;




-- Insert default permissions for API keys

INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_READ_ORGANIZATION_WEB_SITES', 'Permission to read API Keys'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE'
                   and name = 'OP_READ_ORGANIZATION_WEB_SITES');


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_READ_ORGANIZATION_WEB_SITES'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_EDIT_ORGANIZATION_WEB_SITES', 'Permission to edit API Keys'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE'
                   and name = 'OP_EDIT_ORGANIZATION_WEB_SITES');


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_EDIT_ORGANIZATION_WEB_SITES'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


-- Update subscription plans with organization web sites
UPDATE gendox_core.subscription_plans
SET organization_web_sites = CASE name
    WHEN 'Free Plan' THEN 1
    WHEN 'Basic Plan' THEN 3
    WHEN 'Pro Plan' THEN 9999
    WHEN 'Business Plan' THEN 9999
    ELSE organization_web_sites
END
WHERE organization_web_sites IS NULL;