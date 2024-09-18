ALTER TABLE gendox_core.subscription_plans
DROP COLUMN IF EXISTS ai_models_tier_type_id;

CREATE TABLE IF NOT EXISTS gendox_core.subscription_ai_model_tier (
    id uuid DEFAULT uuid_generate_v4(),
    subscription_plan_id UUID NOT NULL,
    ai_model_tier_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
       updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (subscription_plan_id) REFERENCES gendox_core.subscription_plans(id),
    FOREIGN KEY (ai_model_tier_id) REFERENCES gendox_core.types(id)
);

------------------------------------------------------------------------------------------------------------------------
-------------------    INSERTING AI MODEL TIERS FOR FREE PLAN   ------------------------------------------------
insert into gendox_core.subscription_ai_model_tier (subscription_plan_id, ai_model_tier_id,created_at, updated_at)
select sp.id AS subscription_plan_id, amt.id AS ai_model_tier_id, now(), now()
from gendox_core.subscription_plans sp, gendox_core.types amt
where sp.name = 'Free Plan' and sp.sku = 'gd-free-001'
  and amt.type_category = 'MODEL_TIER' and amt.name = 'FREE_MODEL'
  and not exists (select * from gendox_core.subscription_ai_model_tier where subscription_plan_id = sp.id and ai_model_tier_id = amt.id);

insert into gendox_core.subscription_ai_model_tier (subscription_plan_id, ai_model_tier_id,created_at, updated_at)
  select sp.id AS subscription_plan_id, amt.id AS ai_model_tier_id, now(), now()
  from gendox_core.subscription_plans sp, gendox_core.types amt
  where sp.name = 'Basic Plan'
    and amt.type_category = 'MODEL_TIER' and amt.name = 'STANDARD_MODEL'
    and not exists (select * from gendox_core.subscription_ai_model_tier where subscription_plan_id = sp.id and ai_model_tier_id = amt.id);

------------------------------------------------------------------------------------------------------------------------
-------------------    INSERTING AI MODEL TIERS FOR BASIC PLAN   ------------------------------------------------
insert into gendox_core.subscription_ai_model_tier (subscription_plan_id, ai_model_tier_id,created_at, updated_at)
select sp.id AS subscription_plan_id, amt.id AS ai_model_tier_id, now(), now()
from gendox_core.subscription_plans sp, gendox_core.types amt
where sp.name = 'Basic Plan'
  and amt.type_category = 'MODEL_TIER' and amt.name = 'FREE_MODEL'
  and not exists (select * from gendox_core.subscription_ai_model_tier where subscription_plan_id = sp.id and ai_model_tier_id = amt.id);

  insert into gendox_core.subscription_ai_model_tier (subscription_plan_id, ai_model_tier_id,created_at, updated_at)
  select sp.id AS subscription_plan_id, amt.id AS ai_model_tier_id, now(), now()
  from gendox_core.subscription_plans sp, gendox_core.types amt
  where sp.name = 'Basic Plan'
    and amt.type_category = 'MODEL_TIER' and amt.name = 'STANDARD_MODEL'
    and not exists (select * from gendox_core.subscription_ai_model_tier where subscription_plan_id = sp.id and ai_model_tier_id = amt.id);

------------------------------------------------------------------------------------------------------------------------
-------------------    INSERTING AI MODEL TIERS FOR BUSINESS PLAN   ------------------------------------------------
insert into gendox_core.subscription_ai_model_tier (subscription_plan_id, ai_model_tier_id,created_at, updated_at)
select sp.id AS subscription_plan_id, amt.id AS ai_model_tier_id, now(), now()
from gendox_core.subscription_plans sp, gendox_core.types amt
where sp.name = 'Business Plan'
  and amt.type_category = 'MODEL_TIER' and amt.name = 'FREE_MODEL'
  and not exists (select * from gendox_core.subscription_ai_model_tier where subscription_plan_id = sp.id and ai_model_tier_id = amt.id);

  insert into gendox_core.subscription_ai_model_tier (subscription_plan_id, ai_model_tier_id,created_at, updated_at)
  select sp.id AS subscription_plan_id, amt.id AS ai_model_tier_id, now(), now()
  from gendox_core.subscription_plans sp, gendox_core.types amt
  where sp.name = 'Business Plan'
    and amt.type_category = 'MODEL_TIER' and amt.name = 'STANDARD_MODEL'
    and not exists (select * from gendox_core.subscription_ai_model_tier where subscription_plan_id = sp.id and ai_model_tier_id = amt.id);

  insert into gendox_core.subscription_ai_model_tier (subscription_plan_id, ai_model_tier_id,created_at, updated_at)
  select sp.id AS subscription_plan_id, amt.id AS ai_model_tier_id, now(), now()
  from gendox_core.subscription_plans sp, gendox_core.types amt
  where sp.name = 'Business Plan'
    and amt.type_category = 'MODEL_TIER' and amt.name = 'CUSTOM_MODEL'
    and not exists (select * from gendox_core.subscription_ai_model_tier where subscription_plan_id = sp.id and ai_model_tier_id = amt.id);

------------------------------------------------------------------------------------------------------------------------
-------------------    INSERTING AI MODEL TIERS FOR PRO PLAN   ------------------------------------------------
insert into gendox_core.subscription_ai_model_tier (subscription_plan_id, ai_model_tier_id, created_at, updated_at)
select sp.id AS subscription_plan_id, amt.id AS ai_model_tier_id, now(), now()
from gendox_core.subscription_plans sp, gendox_core.types amt
where sp.name = 'Pro Plan'
  and amt.type_category = 'MODEL_TIER' and amt.name = 'FREE_MODEL'
  and not exists (select * from gendox_core.subscription_ai_model_tier where subscription_plan_id = sp.id and ai_model_tier_id = amt.id);

  insert into gendox_core.subscription_ai_model_tier (subscription_plan_id, ai_model_tier_id, created_at, updated_at)
  select sp.id AS subscription_plan_id, amt.id AS ai_model_tier_id, now(), now()
  from gendox_core.subscription_plans sp, gendox_core.types amt
  where sp.name = 'Pro Plan'
    and amt.type_category = 'MODEL_TIER' and amt.name = 'STANDARD_MODEL'
    and not exists (select * from gendox_core.subscription_ai_model_tier where subscription_plan_id = sp.id and ai_model_tier_id = amt.id);

  insert into gendox_core.subscription_ai_model_tier (subscription_plan_id, ai_model_tier_id, created_at, updated_at)
  select sp.id AS subscription_plan_id, amt.id AS ai_model_tier_id, now(), now()
  from gendox_core.subscription_plans sp, gendox_core.types amt
  where sp.name = 'Pro Plan'
    and amt.type_category = 'MODEL_TIER' and amt.name = 'CUSTOM_MODEL'
    and not exists (select * from gendox_core.subscription_ai_model_tier where subscription_plan_id = sp.id and ai_model_tier_id = amt.id);

 insert into gendox_core.subscription_ai_model_tier (subscription_plan_id, ai_model_tier_id, created_at, updated_at)
  select sp.id AS subscription_plan_id, amt.id AS ai_model_tier_id, now(), now()
  from gendox_core.subscription_plans sp, gendox_core.types amt
  where sp.name = 'Pro Plan'
    and amt.type_category = 'MODEL_TIER' and amt.name = 'PREMIUM_MODEL'
    and not exists (select * from gendox_core.subscription_ai_model_tier where subscription_plan_id = sp.id and ai_model_tier_id = amt.id);