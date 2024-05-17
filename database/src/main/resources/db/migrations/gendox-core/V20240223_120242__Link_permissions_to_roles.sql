------------------------------------------------------------------------------------------------------------------------
-------------------    INSERTING PERMISSIONS FOR ROLE_ADMIN    ------------------------------------------------
insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_UPDATE_ORGANIZATION'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_CREATE_PROJECT'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_UPDATE_PROJECT'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_DELETE_PROJECT'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_ADD_PROJECT_MEMBERS'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_REMOVE_PROJECT_MEMBERS'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


------------------------------------------------------------------------------------------------------------------------
-------------------    INSERTING PERMISSIONS FOR ROLE_EDITOR    ---------------------------------------------------------

insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_EDITOR'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_UPDATE_ORGANIZATION'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_EDITOR'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_CREATE_PROJECT'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_EDITOR'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_UPDATE_PROJECT'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_EDITOR'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_ADD_PROJECT_MEMBERS'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);



