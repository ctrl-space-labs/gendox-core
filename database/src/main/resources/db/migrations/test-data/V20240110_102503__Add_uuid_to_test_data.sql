INSERT into gendox_core.users
    (id)
       '84817595-6c8e-4427-9b44-56671cbf4569'
where not exists(SELECT * FROM gendox_core.users where email = 'testuser2@test.com');
