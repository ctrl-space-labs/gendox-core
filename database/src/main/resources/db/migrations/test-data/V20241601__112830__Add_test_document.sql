INSERT INTO gendox_core.document_instance
   (id,organization_id, remote_url, created_at, updated_at)
SELECT  'ea62ad10-5c03-4dfc-8040-32970b53bb8d',
        (SELECT id
                FROM gendox_core.organizations
                WHERE name = 'test organization1'),
              'file:C:\ProgramData\\gendox\\documents/41ce6db7-70fd-411d-b3d8-f2d5775ed501/dda1148a-2251-4082-b838-6834251f59a0/01.-Introduction.md',
               now(),
               now()

        WHERE NOT EXISTS(SELECT *
                         FROM gendox_core.document_instance
                         WHERE id = 'ea62ad10-5c03-4dfc-8040-32970b53bb8d'
                         );--