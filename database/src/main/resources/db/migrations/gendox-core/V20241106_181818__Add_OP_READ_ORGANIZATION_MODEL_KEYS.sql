INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_READ_ORGANIZATION_MODEL_KEYS', 'Permission to read organization plan'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE'
                   and name = 'OP_READ_ORGANIZATION_MODEL_KEYS');


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_READ_ORGANIZATION_MODEL_KEYS'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);