------------------------------------------------------------------------------------------------------------------------
-------------------------  INSERTING ROLE_OWNER    ------------------------------------------------
INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_TYPE', 'ROLE_OWNER', 'This is the owner role of the organization'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'ORGANIZATION_ROLE_TYPE'
                 and name = 'ROLE_OWNER');

------------------------------------------------------------------------------------------------------------------------
-------------------    INSERTING PERMISSIONS FOR ROLE_OWNER    ------------------------------------------------
INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_MANAGE_SUBSCRIPTIONS', 'Can manage subscriptions (refund, create, update)'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE'
                 and name = 'OP_MANAGE_SUBSCRIPTIONS');


------------------------------------------------------------------------------------------------------------------------
-------------------    INSERTING PERMISSIONS FOR ROLE_OWNER    ------------------------------------------------
insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_UPDATE_ORGANIZATION'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_CREATE_PROJECT'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_UPDATE_PROJECT'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_DELETE_PROJECT'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_ADD_PROJECT_MEMBERS'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_REMOVE_PROJECT_MEMBERS'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_MANAGE_SUBSCRIPTIONS'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_READ_API_KEYS'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);

insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_EDIT_API_KEYS'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);

insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_VERIFY_PROVEN_AI_ORG_VP'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_READ_PROVEN_AI_DATAPOD'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_EDIT_PROVEN_AI_DATAPOD'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_DELETE_PROVEN_AI_DATAPOD'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_OFFER_PROVEN_AI_DATAPOD_VC'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_READ_PROVEN_AI_AGENT'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);

insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_EDIT_PROVEN_AI_AGENT'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);

insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_OFFER_PROVEN_AI_AGENT_VC'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);

insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_DELETE_PROVEN_AI_AGENT'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);

insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_READ_ORGANIZATION_WEB_SITES'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);

insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_EDIT_ORGANIZATION_WEB_SITES'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);

insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_DELETE_ORGANIZATION'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);

insert into gendox_core.role_permission (role_id, permission_id)
select r.id, p.id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_READ_DOCUMENT'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);

insert into gendox_core.role_permission (role_id, permission_id)
select r.id, p.id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_WRITE_DOCUMENT'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id, p.id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_ADD_USERS'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id, p.id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_REMOVE_USERS'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id, p.id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_EDIT_PROJECT_SETTINGS'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);

insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_READ_ORGANIZATION_PLAN'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);

insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_EDIT_ORGANIZATION_MODEL_KEYS'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);

insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_OWNER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_READ_ORGANIZATION_MODEL_KEYS'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);