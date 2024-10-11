-- add STANDARD models to FREE plan


insert into gendox_core.subscription_ai_model_tier (subscription_plan_id, ai_model_tier_id,created_at, updated_at)
select sp.id AS subscription_plan_id, amt.id AS ai_model_tier_id, now(), now()
from gendox_core.subscription_plans sp, gendox_core.types amt
where sp.sku = 'gd-free-001'
  and amt.type_category = 'MODEL_TIER' and amt.name = 'STANDARD_MODEL'
  and not exists (select * from gendox_core.subscription_ai_model_tier where subscription_plan_id = sp.id and ai_model_tier_id = amt.id);




