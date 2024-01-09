INSERT INTO gendox_core.user_organization
    (user_id, organization_id, organization_role_id)
select (select id
        from gendox_core.users
        where email = 'testuser1@test.com'),
       (select id
        from gendox_core.organizations
        where name = 'test organization1'),
       (select id
        from gendox_core.types
        where name = 'OP_EDIT_PROJECT_SETTINGS')
where not exists(SELECT *
                 FROM gendox_core.user_organization
                 where user_id = (select id
                                  from gendox_core.users
                                  where email = 'testuser1@test.com')
                   and organization_id = (select id
                                          from gendox_core.organizations
                                          where name = 'test organization1'));


INSERT INTO gendox_core.user_organization
    (user_id, organization_id, organization_role_id)
select (select id
        from gendox_core.users
        where email = 'testuser2@test.com'),
       (select id
        from gendox_core.organizations
        where name = 'test organization2'),
       (select id
        from gendox_core.types
        where name = 'OP_EDIT_PROJECT_SETTINGS\')
where not exists(SELECT *
                 FROM gendox_core.user_organization
                 where user_id = (select id
                                  from gendox_core.users
                                  where email = 'testuser2@test.com')
                   and organization_id = (select id
                                          from gendox_core.organizations
                                          where name = 'test organization2'));
