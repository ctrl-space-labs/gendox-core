--------------------------------------------------------------------------------------------------------
----------------------------------  Create Users   --------------------------------


INSERT into gendox_core.users
    (name, email, global_role_id)
select 'John Doe',
       'jdoe@test.com',
       (SELECT id
        FROM gendox_core.types
        where type_category = 'GLOBAL_APPLICATION_ROLE_TYPE'
          and name = 'ROLE_USER')
where not exists(SELECT * FROM gendox_core.users where email = 'jdoe@test.com');




INSERT into gendox_core.users
    (name, email, global_role_id)
select 'Chris Sekas',
       'csekas@test.com',
       (SELECT id
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
        where name = 'ROLE_ADMIN')
where not exists(SELECT *
                 FROM gendox_core.user_organization
                 where user_id = (select id
                                  from gendox_core.users
                                  where email = 'jdoe@test.com')
                   and organization_id = (select id
                                          from gendox_core.organizations
                                          where name = 'github'));


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
        where name = 'ROLE_ADMIN')
where not exists(SELECT *
                 FROM gendox_core.user_organization
                 where user_id = (select id
                                  from gendox_core.users
                                  where email = 'jdoe@test.com')
                   and organization_id = (select id
                                          from gendox_core.organizations
                                          where name = 'facebook'));


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
        where name = 'ROLE_ADMIN')
where not exists(SELECT *
                 FROM gendox_core.user_organization
                 where user_id = (select id
                                  from gendox_core.users
                                  where email = 'csekas@test.com')
                   and organization_id = (select id
                                          from gendox_core.organizations
                                          where name = 'facebook'));



--------------------------------------------------------------------------------------------------------
---------------------------------- Create Projects for Organizations   ---------------------------------


INSERT INTO gendox_core.projects
    (organization_id, name, description, created_at, updated_at)
select (select id
        from gendox_core.organizations
        where name = 'github'),
       'Java AI Tutor',
       'AI Tutor is an AI expert that helps students to learn new concepts like Java',
       now(),
       now()
where not exists(SELECT *
                 FROM gendox_core.projects
                 where name = 'Java AI Tutor');

INSERT INTO gendox_core.projects
    (organization_id, name, description, created_at, updated_at)
select (select id
        from gendox_core.organizations
        where name = 'github'),
       'HR Onboarding',
       'HR Onboarding is an AI expert that helps HR to onboard new employees',
       now(),
       now()
where not exists(SELECT *
                 FROM gendox_core.projects
                 where name = 'HR Onboarding');

INSERT INTO gendox_core.projects
    (organization_id, name, description, created_at, updated_at)
select (select id
        from gendox_core.organizations
        where name = 'facebook'),
       'Facebook AI',
       'Facebook AI is an AI expert that helps Facebook to improve its AI capabilities',
       now(),
       now()
where not exists(SELECT *
                 FROM gendox_core.projects
                 where name = 'Facebook AI');

INSERT INTO gendox_core.projects
    (organization_id, name, description, created_at, updated_at)
select (select id
        from gendox_core.organizations
        where name = 'facebook'),
       'Facebook Ads Expert',
       'Facebook Ads Expert is an AI expert that helps Facebook User to improve its Ads targeting',
       now(),
       now()
where not exists(SELECT *
                 FROM gendox_core.projects
                 where name = 'Facebook Ads Expert');


--------------------------------------------------------------------------------------------------------
---------------------------------- Invite Users as Project Members   ---------------------------------

INSERT INTO gendox_core.project_members
    (project_id, user_id)
select (select id
        from gendox_core.projects
        where name = 'Facebook Ads Expert'),
       (select id
        from gendox_core.users
        where email = 'csekas@test.com')

where not exists(SELECT *
                 FROM gendox_core.project_members
                 where project_id = (select id
                                     from gendox_core.projects
                                     where name = 'Facebook Ads Expert')
                   and user_id = (select id
                                  from gendox_core.users
                                  where email = 'csekas@test.com'));

INSERT INTO gendox_core.project_members
(project_id, user_id)
select (select id
        from gendox_core.projects
        where name = 'Facebook AI'),
       (select id
        from gendox_core.users
        where email = 'jdoe@test.com')
where not exists(SELECT *
                 FROM gendox_core.project_members
                 where project_id = (select id
                                     from gendox_core.projects
                                     where name = 'Facebook AI')
                   and user_id = (select id
                                  from gendox_core.users
                                  where email = 'jdoe@test.com'));

INSERT INTO gendox_core.project_members
(project_id, user_id)
select (select id
        from gendox_core.projects
        where name = 'Java AI Tutor'),
       (select id
        from gendox_core.users
        where email = 'jdoe@test.com')
where not exists(SELECT *
                 FROM gendox_core.project_members
                 where project_id = (select id
                                     from gendox_core.projects
                                     where name = 'Java AI Tutor')
                   and user_id = (select id
                                  from gendox_core.users
                                  where email = 'jdoe@test.com'));
