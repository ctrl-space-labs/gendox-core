INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_VERIFY_PROVEN_AI_ORG_VP', 'Permission to verify a provenAI organization VP'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE'
                 and name = 'OP_VERIFY_PROVEN_AI_ORG_VP');

INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_READ_PROVEN_AI_DATAPOD', 'Permission to read a data pod from provenAI'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE'
                 and name = 'OP_READ_PROVEN_AI_DATAPOD');


INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_EDIT_PROVEN_AI_DATAPOD', 'Permission to edit a data pod from provenAI'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE'
                 and name = 'OP_EDIT_PROVEN_AI_DATAPOD');

INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_DELETE_PROVEN_AI_DATAPOD', 'Permission to delete a data pod from provenAI'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE'
                 and name = 'OP_DELETE_PROVEN_AI_DATAPOD');

INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_OFFER_PROVEN_AI_DATAPOD_VC', 'Permission to create a provenAI data pod VC offer'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE'
                 and name = 'OP_OFFER_PROVEN_AI_DATAPOD_VC');


INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_READ_PROVEN_AI_AGENT', 'Permission to read an agent from provenAI'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE'
                 and name = 'OP_READ_PROVEN_AI_AGENT');

INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_EDIT_PROVEN_AI_AGENT', 'Permission to edit an agent from provenAI'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE'
                 and name = 'OP_EDIT_PROVEN_AI_AGENT');

INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_OFFER_PROVEN_AI_AGENT_VC', 'Permission to create a provenAI agent VC offer'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE'
                 and name = 'OP_OFFER_PROVEN_AI_AGENT_VC');

INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_DELETE_PROVEN_AI_AGENT', 'Permission to delete an agent from provenAI'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE'
                 and name = 'OP_DELETE_PROVEN_AI_AGENT');

INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_PROVEN_AI_AGENT_SEARCH', 'Permission for provenAI agent for semantic search'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE'
                 and name = 'OP_PROVEN_AI_AGENT_SEARCH');


------------------------------------------------------------------------------------------------------------------------
-------------------    INSERTING PERMISSIONS FOR ROLE_ADMIN    ------------------------------------------------
insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_VERIFY_PROVEN_AI_ORG_VP'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_READ_PROVEN_AI_DATAPOD'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_EDIT_PROVEN_AI_DATAPOD'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_DELETE_PROVEN_AI_DATAPOD'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_OFFER_PROVEN_AI_DATAPOD_VC'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_READ_PROVEN_AI_AGENT'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);

insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_EDIT_PROVEN_AI_AGENT'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);

insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_OFFER_PROVEN_AI_AGENT_VC'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);

insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_DELETE_PROVEN_AI_AGENT'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);