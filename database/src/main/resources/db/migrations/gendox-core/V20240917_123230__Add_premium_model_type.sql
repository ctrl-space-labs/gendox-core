INSERT into gendox_core.types
(type_category, name, description)
select 'MODEL_TIER', 'PREMIUM_MODEL', 'Premium model tier'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'MODEL_TIER'
                   and name = 'PREMIUM_MODEL');
