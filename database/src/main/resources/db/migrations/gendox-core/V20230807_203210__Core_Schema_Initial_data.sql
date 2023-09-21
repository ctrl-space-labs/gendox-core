
INSERT into gendox_core.types
(type_category, name, description)
select 'GLOBAL_APPLICATION_ROLE_TYPE', 'ROLE_SUPER_ADMIN', 'This is for Administrators'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'GLOBAL_APPLICATION_ROLE_TYPE'
                   and name = 'ROLE_SUPER_ADMIN');
INSERT into gendox_core.types
(type_category, name, description)
select 'GLOBAL_APPLICATION_ROLE_TYPE', 'ROLE_USER', 'This is a simple user'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'GLOBAL_APPLICATION_ROLE_TYPE'
                   and name = 'ROLE_USER');


INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_TYPE', 'ROLE_ADMIN', 'This is for Administrators for an Organization'
where not exists(SELECT * FROM gendox_core.types where type_category = 'ORGANIZATION_ROLE_TYPE' and name = 'ROLE_ADMIN');


INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_TYPE', 'ROLE_READER', 'This is Read only Users for an Organization'
where not exists(SELECT * FROM gendox_core.types where type_category = 'ORGANIZATION_ROLE_TYPE' and name = 'ROLE_READER');


INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_TYPE', 'ROLE_EDITOR', 'This is a User with write access for an Organization'
where not exists(SELECT * FROM gendox_core.types where type_category = 'ORGANIZATION_ROLE_TYPE' and name = 'ROLE_EDITOR');


INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_READ_DOCUMENT', 'Fine-Grained permission to read a document'
where not exists(SELECT * FROM gendox_core.types where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and name = 'OP_READ_DOCUMENT');

INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_WRITE_DOCUMENT', 'Fine-Grained permission to write a document'
where not exists(SELECT * FROM gendox_core.types where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and name = 'OP_WRITE_DOCUMENT');

INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_ADD_USERS', 'Permission to add users from an organization'
where not exists(SELECT * FROM gendox_core.types where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and name = 'OP_ADD_USERS');

INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_REMOVE_USERS', 'Permission to remove users from an organization'
where not exists(SELECT * FROM gendox_core.types where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and name = 'OP_REMOVE_USERS');

INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_DELETE_ORGANIZATION', 'Permission to delete an organization'
where not exists(SELECT * FROM gendox_core.types where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and name = 'OP_DELETE_ORGANIZATION');

INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_EDIT_PROJECT_SETTINGS', 'Permission to edit a project settings'
where not exists(SELECT * FROM gendox_core.types where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and name = 'OP_EDIT_PROJECT_SETTINGS');



------------------------------------------------------------------------------------------------------------------------
-------------------    INSERTING DEFAULT PERMISSIONS FOR ROLE_ADMIN    ------------------------------------------------
insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_DELETE_ORGANIZATION'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id, p.id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_READ_DOCUMENT'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id, p.id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_WRITE_DOCUMENT'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id, p.id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_ADD_USERS'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id, p.id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_REMOVE_USERS'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


insert into gendox_core.role_permission (role_id, permission_id)
select r.id, p.id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_EDIT_PROJECT_SETTINGS'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);

------------------------------------------------------------------------------------------------------------------------
-------------------    INSERTING DEFAULT PERMISSIONS FOR ROLE_EDITOR    ------------------------------------------------
insert into gendox_core.role_permission (role_id, permission_id)
select r.id, p.id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_EDITOR'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_READ_DOCUMENT'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);

insert into gendox_core.role_permission (role_id, permission_id)
select r.id, p.id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_EDITOR'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_WRITE_DOCUMENT'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);

insert into gendox_core.role_permission (role_id, permission_id)
select r.id, p.id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_EDITOR'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_ADD_USERS'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);

insert into gendox_core.role_permission (role_id, permission_id)
select r.id, p.id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_EDITOR'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_REMOVE_USERS'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);

insert into gendox_core.role_permission (role_id, permission_id)
select r.id, p.id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_EDITOR'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_EDIT_PROJECT_SETTINGS'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);


------------------------------------------------------------------------------------------------------------------------
-------------------    INSERTING DEFAULT PERMISSIONS FOR ROLE_READER   ------------------------------------------------

insert into gendox_core.role_permission (role_id, permission_id)
select r.id, p.id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_READER'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_READ_DOCUMENT'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);
------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------



INSERT into gendox_core.types
(type_category, name, description)
select 'DOCUMENT_FIELD_TYPE', 'FIELD_TEXT', 'Simple text field'
where not exists(SELECT * FROM gendox_core.types where name = 'FIELD_TEXT');

INSERT into gendox_core.types
(type_category, name, description)
select 'DOCUMENT_FIELD_TYPE', 'FIELD_RICH_TEXT', 'Rich text area, like WYSIWYG'
where not exists(SELECT * FROM gendox_core.types where name = 'FIELD_RICH_TEXT');

INSERT into gendox_core.types
(type_category, name, description)
select 'DOCUMENT_FIELD_TYPE', 'FIELD_NUMBER', 'Number field'
where not exists(SELECT * FROM gendox_core.types where name = 'FIELD_NUMBER');

INSERT into gendox_core.types
(type_category, name, description)
select 'DOCUMENT_FIELD_TYPE', 'FIELD_DATE_TIME', 'Date field'
where not exists(SELECT * FROM gendox_core.types where name = 'FIELD_DATE_TIME');

INSERT into gendox_core.types
(type_category, name, description)
select 'DOCUMENT_FIELD_TYPE', 'FIELD_CHECKBOX', 'Checkbox field'
where not exists(SELECT * FROM gendox_core.types where name = 'FIELD_CHECKBOX');

INSERT into gendox_core.types
(type_category, name, description)
select 'DOCUMENT_FIELD_TYPE',
       'FIELD_MULTI_RADIO',
       'Multiple choice Radio field, that user can select exactly one option'
where not exists(SELECT * FROM gendox_core.types where name = 'FIELD_MULTI_RADIO');

INSERT into gendox_core.types
(type_category, name, description)
select 'DOCUMENT_FIELD_TYPE',
       'FIELD_MULTI_CHECKBOX',
       'Multiple choice Checkbox field, that user can select multiple options'
where not exists(SELECT * FROM gendox_core.types where name = 'FIELD_MULTI_CHECKBOX');

INSERT into gendox_core.types
(type_category, name, description)
select 'DOCUMENT_FIELD_TYPE', 'FIELD_FILE', 'File field, that user can upload a file'
where not exists(SELECT * FROM gendox_core.types where name = 'FIELD_FILE');

INSERT into gendox_core.types
(type_category, name, description)
select 'DOCUMENT_FIELD_TYPE', 'FIELD_IMAGE', 'Image field, that user can upload an image'
where not exists(SELECT * FROM gendox_core.types where name = 'FIELD_IMAGE');

INSERT into gendox_core.types
(type_category, name, description)
select 'DOCUMENT_FIELD_TYPE', 'FIELD_VIDEO', 'Video field, that user can upload a video'
where not exists(SELECT * FROM gendox_core.types where name = 'FIELD_VIDEO');

INSERT into gendox_core.types
(type_category, name, description)
select 'DOCUMENT_FIELD_TYPE', 'FIELD_AUDIO', 'Audio field, that user can upload an audio'
where not exists(SELECT * FROM gendox_core.types where name = 'FIELD_AUDIO');

INSERT into gendox_core.types
(type_category, name, description)
select 'DOCUMENT_FIELD_TYPE', 'FIELD_LOCATION', 'Location field, that user can select a location'
where not exists(SELECT * FROM gendox_core.types where name = 'FIELD_LOCATION');

INSERT into gendox_core.types
(type_category, name, description)
select 'DOCUMENT_FIELD_TYPE', 'FIELD_SIGNATURE', 'Signature field, that user can sign'
where not exists(SELECT * FROM gendox_core.types where name = 'FIELD_SIGNATURE');

INSERT into gendox_core.types
(type_category, name, description)
select 'DOCUMENT_FIELD_TYPE', 'FIELD_BARCODE', 'Barcode field, that user can scan a barcode'
where not exists(SELECT * FROM gendox_core.types where name = 'FIELD_BARCODE');

INSERT into gendox_core.types
(type_category, name, description)
select 'DOCUMENT_FIELD_TYPE', 'FIELD_SLIDER', 'Slider field, that user can select a value from a range'
where not exists(SELECT * FROM gendox_core.types where name = 'FIELD_SLIDER');

INSERT into gendox_core.types
(type_category, name, description)
select 'DOCUMENT_FIELD_TYPE', 'FIELD_RATING', 'Rating field, that user can rate'
where not exists(SELECT * FROM gendox_core.types where name = 'FIELD_RATING');


INSERT into gendox_core.types
(type_category, name, description)
select 'DOCUMENT_FIELD_TYPE', 'FIELD_EMAIL', 'Email field, that user can enter an email'
where not exists(SELECT * FROM gendox_core.types where name = 'FIELD_EMAIL');

INSERT into gendox_core.types
(type_category, name, description)
select 'DOCUMENT_FIELD_TYPE', 'FIELD_URL', 'URL field, that user can enter an URL'
where not exists(SELECT * FROM gendox_core.types where name = 'FIELD_URL');

INSERT into gendox_core.types
(type_category, name, description)
select 'FIELD_VALIDATION_TYPE', 'FIELD_VALIDATION_PHONE', 'Validation that checks a text is a phone number'
where not exists(SELECT * FROM gendox_core.types where name = 'FIELD_VALIDATION_PHONE');

INSERT into gendox_core.types
(type_category, name, description)
select 'FIELD_VALIDATION_TYPE', 'FIELD_VALIDATION_EMAIL', 'Validation that checks a text is an email'
where not exists(SELECT * FROM gendox_core.types where name = 'FIELD_VALIDATION_EMAIL');

INSERT into gendox_core.types
(type_category, name, description)
select 'FIELD_VALIDATION_TYPE', 'FIELD_VALIDATION_URL', 'Validation that checks a text is an URL'
where not exists(SELECT * FROM gendox_core.types where name = 'FIELD_VALIDATION_URL');






