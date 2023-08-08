

--------------------------------------------------------------------------------------------------------
----------------------------------  Create Users   --------------------------------



INSERT into gendox_core.users
(name, email, global_role_id)
select 'John Doe', 'jdoe@test.com', (SELECT id
                                     FROM gendox_core.types
                                     where type_category = 'GLOBAL_APPLICATION_ROLE_TYPE'
                                       and name = 'ROLE_USER')
where not exists(SELECT * FROM gendox_core.users where email = 'jdoe@test.com');


INSERT into gendox_core.users
(name, email, global_role_id)
select 'Chris Sekas', 'csekas@test.com', (SELECT id
                                          FROM gendox_core.types
                                          where type_category = 'GLOBAL_APPLICATION_ROLE_TYPE'
                                            and name = 'ROLE_USER')
where not exists(SELECT * FROM gendox_core.users where email = 'csekas@test.com');

--------------------------------------------------------------------------------------------------------
----------------------------------  Create Organizations   --------------------------------

INSERT into gendox_core.organizations
(name, display_name, address, phone)
select 'github', 'GitHub', 'Palo alto 1', '+0123456789'
where not exists(SELECT * FROM gendox_core.organizations where name = 'github');


INSERT into gendox_core.organizations
(name, display_name, address, phone)
select 'facebook', 'Facebook', 'Palo alto 2', '+01343434'
where not exists(SELECT * FROM gendox_core.organizations where name = 'facebook');


--------------------------------------------------------------------------------------------------------
---------------------------------- Associate users with organizations   --------------------------------


INSERT INTO gendox_core.user_organization
(user_id, organization_id, organization_role_id)
select (select id
        from gendox_core.users
        where email = 'jdoe@test.com'),
       (select id
        from gendox_core.organizations
        where name = 'github'),
       (select id
        from gendox_core.types
        where name = 'ROLE_ADMIN');


INSERT INTO gendox_core.user_organization
(user_id, organization_id, organization_role_id)
select (select id
        from gendox_core.users
        where email = 'jdoe@test.com'),
       (select id
        from gendox_core.organizations
        where name = 'facebook'),
       (select id
        from gendox_core.types
        where name = 'ROLE_ADMIN');


INSERT INTO gendox_core.user_organization
(user_id, organization_id, organization_role_id)
select (select id
        from gendox_core.users
        where email = 'csekas@test.com'),
       (select id
        from gendox_core.organizations
        where name = 'facebook'),
       (select id
        from gendox_core.types
        where name = 'ROLE_ADMIN');