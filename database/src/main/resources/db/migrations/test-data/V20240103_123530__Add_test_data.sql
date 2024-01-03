--------------------------------------------------------------------------------------------------------
----------------------------------  Create Test Users   --------------------------------

INSERT into gendox_core.users
    (name, email, users_type_id)
select 'Test User1',
       'testuser1@test.com',
       (SELECT id
        FROM gendox_core.types
        where type_category = 'GLOBAL_APPLICATION_ROLE_TYPE'
          and name = 'ROLE_USER')
where not exists(SELECT * FROM gendox_core.users where email = 'testuser1@test.com');

INSERT into gendox_core.users
    (name, email, users_type_id)
select 'Test User2',
       'testuser2@test.com',
       (SELECT id
        FROM gendox_core.types
        where type_category = 'GLOBAL_APPLICATION_ROLE_TYPE'
          and name = 'ROLE_USER')
where not exists(SELECT * FROM gendox_core.users where email = 'testuser2@test.com');

INSERT into gendox_core.users
    (name, email, users_type_id)
select 'Test User3',
       'testuser3@test.com',
       (SELECT id
        FROM gendox_core.types
        where type_category = 'GLOBAL_APPLICATION_ROLE_TYPE'
          and name = 'ROLE_USER')
where not exists(SELECT * FROM gendox_core.users where email = 'testuser3@test.com');

INSERT into gendox_core.users
    (name, email, users_type_id)
select 'Test User4',
       'testuser4@test.com',
       (SELECT id
        FROM gendox_core.types
        where type_category = 'GLOBAL_APPLICATION_ROLE_TYPE'
          and name = 'ROLE_USER')
where not exists(SELECT * FROM gendox_core.users where email = 'testuser4@test.com');

--------------------------------------------------------------------------------------------------------
----------------------------------  Create Organizations   --------------------------------

INSERT into gendox_core.organizations
    (name, display_name, address, phone)
select 'test organization1', 'Test Organization1', 'Nowhere1', '+0123456789'
where not exists(SELECT * FROM gendox_core.organizations where name = 'test organization1');

INSERT into gendox_core.organizations
    (name, display_name, address, phone)
select 'test organization2', 'Test Organization2', 'Nowhere2', '+0123456789'
where not exists(SELECT * FROM gendox_core.organizations where name = 'test organization2');

--------------------------------------------------------------------------------------------------------
---------------------------------- Associate users with organizations   --------------------------------

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
        where name = 'ROLE_ADMIN')
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
        where name = 'test organization1'),
       (select id
        from gendox_core.types
        where name = 'ROLE_EDITOR')
where not exists(SELECT *
                 FROM gendox_core.user_organization
                 where user_id = (select id
                                  from gendox_core.users
                                  where email = 'testuser2@test.com')
                   and organization_id = (select id
                                          from gendox_core.organizations
                                          where name = 'test organization1'));


INSERT INTO gendox_core.user_organization
    (user_id, organization_id, organization_role_id)
select (select id
        from gendox_core.users
        where email = 'testuser3@test.com'),
       (select id
        from gendox_core.organizations
        where name = 'test organization1'),
       (select id
        from gendox_core.types
        where name = 'ROLE_EDITOR')
where not exists(SELECT *
                 FROM gendox_core.user_organization
                 where user_id = (select id
                                  from gendox_core.users
                                  where email = 'testuser3@test.com')
                   and organization_id = (select id
                                          from gendox_core.organizations
                                          where name = 'test organization1'));


INSERT INTO gendox_core.user_organization
    (user_id, organization_id, organization_role_id)
select (select id
        from gendox_core.users
        where email = 'testuser4@test.com'),
       (select id
        from gendox_core.organizations
        where name = 'test organization1'),
       (select id
        from gendox_core.types
        where name = 'ROLE_READER')
where not exists(SELECT *
                 FROM gendox_core.user_organization
                 where user_id = (select id
                                  from gendox_core.users
                                  where email = 'testuser4@test.com')
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
        where name = 'ROLE_ADMIN')
where not exists(SELECT *
                 FROM gendox_core.user_organization
                 where user_id = (select id
                                  from gendox_core.users
                                  where email = 'testuser2@test.com')
                   and organization_id = (select id
                                          from gendox_core.organizations
                                          where name = 'test organization2'));


INSERT INTO gendox_core.user_organization
    (user_id, organization_id, organization_role_id)
select (select id
        from gendox_core.users
        where email = 'testuser1@test.com'),
       (select id
        from gendox_core.organizations
        where name = 'test organization2'),
       (select id
        from gendox_core.types
        where name = 'ROLE_EDITOR')
where not exists(SELECT *
                 FROM gendox_core.user_organization
                 where user_id = (select id
                                  from gendox_core.users
                                  where email = 'testuser1@test.com')
                   and organization_id = (select id
                                          from gendox_core.organizations
                                          where name = 'test organization2'));


INSERT INTO gendox_core.user_organization
    (user_id, organization_id, organization_role_id)
select (select id
        from gendox_core.users
        where email = 'testuser4@test.com'),
       (select id
        from gendox_core.organizations
        where name = 'test organization2'),
       (select id
        from gendox_core.types
        where name = 'ROLE_READER')
where not exists(SELECT *
                 FROM gendox_core.user_organization
                 where user_id = (select id
                                  from gendox_core.users
                                  where email = 'testuser4@test.com')
                   and organization_id = (select id
                                          from gendox_core.organizations
                                          where name = 'test organization2'));


INSERT INTO gendox_core.user_organization
    (user_id, organization_id, organization_role_id)
select (select id
        from gendox_core.users
        where email = 'testuser3@test.com'),
       (select id
        from gendox_core.organizations
        where name = 'test organization2'),
       (select id
        from gendox_core.types
        where name = 'ROLE_READER')
where not exists(SELECT *
                 FROM gendox_core.user_organization
                 where user_id = (select id
                                  from gendox_core.users
                                  where email = 'testuser3@test.com')
                   and organization_id = (select id
                                          from gendox_core.organizations
                                          where name = 'test organization2'));

--------------------------------------------------------------------------------------------------------
---------------------------------- Create Projects for Organizations   ---------------------------------


INSERT INTO gendox_core.projects
    (organization_id, name, description, created_at, updated_at)
select (select id
        from gendox_core.organizations
        where name = 'test organization1'),
       'Test Project 1.1',
       'Test Project 1 for organization 1',
       now(),
       now()
where not exists(SELECT *
                 FROM gendox_core.projects
                 where name = 'Test Project 1.1');


INSERT INTO gendox_core.projects
    (organization_id, name, description, created_at, updated_at)
select (select id
        from gendox_core.organizations
        where name = 'test organization1'),
       'Test Project 1.2',
       'Test Project 2 for organization 1',
       now(),
       now()
where not exists(SELECT *
                 FROM gendox_core.projects
                 where name = 'Test Project 1.2');


INSERT INTO gendox_core.projects
    (organization_id, name, description, created_at, updated_at)
select (select id
        from gendox_core.organizations
        where name = 'test organization2'),
       'Test Project 2.1',
       'Test Project 1 for organization 2',
       now(),
       now()
where not exists(SELECT *
                 FROM gendox_core.projects
                 where name = 'Test Project 2.1');


INSERT INTO gendox_core.projects
    (organization_id, name, description, created_at, updated_at)
select (select id
        from gendox_core.organizations
        where name = 'test organization2'),
       'Test Project 2.2',
       'Test Project 2 for organization 2',
       now(),
       now()
where not exists(SELECT *
                 FROM gendox_core.projects
                 where name = 'Test Project 2.2');

--------------------------------------------------------------------------------------------------------
---------------------------------- Invite Test Users as Project Members   ---------------------------------


INSERT INTO gendox_core.project_members
    (project_id, user_id)
select (select id
        from gendox_core.projects
        where name = 'Test Project 1.1'),
       (select id
        from gendox_core.users
        where email = 'testuser1@test.com')

where not exists(SELECT *
                 FROM gendox_core.project_members
                 where project_id = (select id
                                     from gendox_core.projects
                                     where name = 'Test Project 1.1')
                   and user_id = (select id
                                  from gendox_core.users
                                  where email = 'testuser1@test.com'));


INSERT INTO gendox_core.project_members
    (project_id, user_id)
select (select id
        from gendox_core.projects
        where name = 'Test Project 1.1'),
       (select id
        from gendox_core.users
        where email = 'testuser2@test.com')

where not exists(SELECT *
                 FROM gendox_core.project_members
                 where project_id = (select id
                                     from gendox_core.projects
                                     where name = 'Test Project 1.1')
                   and user_id = (select id
                                  from gendox_core.users
                                  where email = 'testuser2@test.com'));


INSERT INTO gendox_core.project_members
    (project_id, user_id)
select (select id
        from gendox_core.projects
        where name = 'Test Project 1.2'),
       (select id
        from gendox_core.users
        where email = 'testuser3@test.com')

where not exists(SELECT *
                 FROM gendox_core.project_members
                 where project_id = (select id
                                     from gendox_core.projects
                                     where name = 'Test Project 1.2')
                   and user_id = (select id
                                  from gendox_core.users
                                  where email = 'testuser3@test.com'));


INSERT INTO gendox_core.project_members
    (project_id, user_id)
select (select id
        from gendox_core.projects
        where name = 'Test Project 1.2'),
       (select id
        from gendox_core.users
        where email = 'testuser4@test.com')

where not exists(SELECT *
                 FROM gendox_core.project_members
                 where project_id = (select id
                                     from gendox_core.projects
                                     where name = 'Test Project 1.2')
                   and user_id = (select id
                                  from gendox_core.users
                                  where email = 'testuser4@test.com'));


INSERT INTO gendox_core.project_members
    (project_id, user_id)
select (select id
        from gendox_core.projects
        where name = 'Test Project 2.1'),
       (select id
        from gendox_core.users
        where email = 'testuser1@test.com')

where not exists(SELECT *
                 FROM gendox_core.project_members
                 where project_id = (select id
                                     from gendox_core.projects
                                     where name = 'Test Project 2.1')
                   and user_id = (select id
                                  from gendox_core.users
                                  where email = 'testuser1@test.com'));


INSERT INTO gendox_core.project_members
    (project_id, user_id)
select (select id
        from gendox_core.projects
        where name = 'Test Project 2.1'),
       (select id
        from gendox_core.users
        where email = 'testuser3@test.com')

where not exists(SELECT *
                 FROM gendox_core.project_members
                 where project_id = (select id
                                     from gendox_core.projects
                                     where name = 'Test Project 2.1')
                   and user_id = (select id
                                  from gendox_core.users
                                  where email = 'testuser3@test.com'));


INSERT INTO gendox_core.project_members
    (project_id, user_id)
select (select id
        from gendox_core.projects
        where name = 'Test Project 2.2'),
       (select id
        from gendox_core.users
        where email = 'testuser2@test.com')

where not exists(SELECT *
                 FROM gendox_core.project_members
                 where project_id = (select id
                                     from gendox_core.projects
                                     where name = 'Test Project 2.2')
                   and user_id = (select id
                                  from gendox_core.users
                                  where email = 'testuser2@test.com'));


INSERT INTO gendox_core.project_members
    (project_id, user_id)
select (select id
        from gendox_core.projects
        where name = 'Test Project 2.2'),
       (select id
        from gendox_core.users
        where email = 'testuser4@test.com')

where not exists(SELECT *
                 FROM gendox_core.project_members
                 where project_id = (select id
                                     from gendox_core.projects
                                     where name = 'Test Project 2.2')
                   and user_id = (select id
                                  from gendox_core.users
                                  where email = 'testuser4@test.com'));