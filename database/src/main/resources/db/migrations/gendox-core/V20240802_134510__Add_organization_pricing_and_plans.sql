
CREATE TABLE IF NOT EXISTS gendox_core.subscription_plans
(
    id uuid DEFAULT uuid_generate_v4(),
    sku VARCHAR(255) NOT NULL, -- unique identifier for the product
    sku_type_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    moq INT NOT NULL,
    user_upload_limit_file_count INT NOT NULL,
    user_upload_limit_mb INT NOT NULL,
    user_message_monthly_limit_count INT NOT NULL,
    ai_models_tier_type_id BIGINT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (sku),
    FOREIGN KEY (sku_type_id) REFERENCES gendox_core.types(id),
    FOREIGN KEY (ai_models_tier_type_id) REFERENCES gendox_core.types(id)
);

comment on table gendox_core.subscription_plans is 'Table to store product information. These numbers are aggregated in Organization level. \n eg. if 2 seats have been purchased, then the user_upload_limit_file_count will be 2 * user_upload_limit_file_count';
comment on column gendox_core.subscription_plans.price  is 'Price of the product, per User';
comment on column gendox_core.subscription_plans.moq is 'Minimum Order Quantity, the minimum number of Seats/Users that can be purchased in this plan';
comment on column gendox_core.subscription_plans.user_upload_limit_file_count is 'Maximum number of files a user can upload';
comment on column gendox_core.subscription_plans.user_upload_limit_mb is 'Maximum Total size of files a user can upload, in MB';
comment on column gendox_core.subscription_plans.user_message_monthly_limit_count is 'Maximum number of messages a user can send';
comment on column gendox_core.subscription_plans.ai_models_tier_type_id is 'Tier of AI Models available in this plan. e.g Free Models, Standard Models, Custom Models';
comment on column gendox_core.subscription_plans.active is 'Flag to indicate if the subscription is active or not, only one per subscription type should be active';


CREATE TABLE IF NOT EXISTS gendox_core.api_rate_limits
(
    id UUID DEFAULT uuid_generate_v4(),
    tier_type_id BIGINT NOT NULL,
    public_completions_per_minute INT NOT NULL, --per IP Address
    completions_per_minute INT NOT NULL, --per Auth Users
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (tier_type_id) REFERENCES gendox_core.types(id)
);




-----------------------------------------------------



-----------------------------------------------------
-------------- INSERT SUBSCRIPTION SKU TYPES --------------
-- Inserting SKU_TYPE_FREE
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'SUBSCRIPTION_SKU_TYPE', 'SKU_TYPE_FREE', 'Free subscription SKU type'
WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'SUBSCRIPTION_SKU_TYPE'
                    AND name = 'SKU_TYPE_FREE');

-- Inserting SKU_TYPE_BASIC
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'SUBSCRIPTION_SKU_TYPE', 'SKU_TYPE_BASIC', 'Basic subscription SKU type'
WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'SUBSCRIPTION_SKU_TYPE'
                    AND name = 'SKU_TYPE_BASIC');

-- Inserting SKU_TYPE_PRO
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'SUBSCRIPTION_SKU_TYPE', 'SKU_TYPE_PRO', 'Pro subscription SKU type'
WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'SUBSCRIPTION_SKU_TYPE'
                    AND name = 'SKU_TYPE_PRO');

-- Inserting SKU_TYPE_BUSINESS
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'SUBSCRIPTION_SKU_TYPE', 'SKU_TYPE_BUSINESS', 'Business subscription SKU type'
WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'SUBSCRIPTION_SKU_TYPE'
                    AND name = 'SKU_TYPE_BUSINESS');

-- Inserting SKU_TYPE_CUSTOM
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'SUBSCRIPTION_SKU_TYPE', 'SKU_TYPE_CUSTOM', 'Custom subscription SKU type'
WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'SUBSCRIPTION_SKU_TYPE'
                    AND name = 'SKU_TYPE_CUSTOM');



-------------- INSERT SUBSCRIPTION SKU TYPES --------------
-----------------------------------------------------



-----------------------------------------------------
-------------- INSERT RATE LIMIT TYPES --------------

-- Inserting RATE_LIMIT_FREE
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'RATE_LIMIT', 'RATE_LIMIT_FREE', 'Free tier rate limit'
WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'RATE_LIMIT'
                    AND name = 'RATE_LIMIT_FREE');

-- Inserting RATE_LIMIT_BASIC
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'RATE_LIMIT', 'RATE_LIMIT_BASIC', 'Basic tier rate limit'
WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'RATE_LIMIT'
                    AND name = 'RATE_LIMIT_BASIC');

-- Inserting RATE_LIMIT_PRO
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'RATE_LIMIT', 'RATE_LIMIT_PRO', 'Pro tier rate limit'
WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'RATE_LIMIT'
                    AND name = 'RATE_LIMIT_PRO');

-- Inserting RATE_LIMIT_BUSINESS
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'RATE_LIMIT', 'RATE_LIMIT_BUSINESS', 'Business tier rate limit'
WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'RATE_LIMIT'
                    AND name = 'RATE_LIMIT_BUSINESS');

-- Inserting RATE_LIMIT_CUSTOM
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'RATE_LIMIT', 'RATE_LIMIT_CUSTOM', 'Custom tier rate limit'
WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'RATE_LIMIT'
                    AND name = 'RATE_LIMIT_CUSTOM');


-------------- INSERT RATE LIMIT TYPES --------------
-----------------------------------------------------

-----------------------------------------------------
-------------- INSERT MODEL TIER TYPES  --------------
-- Inserting Free Models
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'MODEL_TIER', 'FREE_MODEL', 'Free model tier'
WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'MODEL_TIER'
                    AND name = 'FREE_MODEL');

-- Inserting Standard Models
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'MODEL_TIER', 'STANDARD_MODEL', 'Standard model tier'
WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'MODEL_TIER'
                    AND name = 'STANDARD_MODEL');

-- Inserting Custom Models
INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'MODEL_TIER', 'CUSTOM_MODEL', 'Custom model tier'
WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.types
                  WHERE type_category = 'MODEL_TIER'
                    AND name = 'CUSTOM_MODEL');


-------------- INSERT MODEL TIER TYPES  --------------
-----------------------------------------------------








-----------------------------------------------------
-------------- INSERT SUBSCRIPTION  --------------
-- Inserting Subscription for Free Tier
INSERT INTO gendox_core.subscription_plans (sku, sku_type_id, name, description, price, currency, moq, user_upload_limit_file_count, user_upload_limit_mb, user_message_monthly_limit_count, ai_models_tier_type_id, created_at, updated_at)
SELECT 'gd-free-001',
       (SELECT id FROM gendox_core.types WHERE name = 'SKU_TYPE_FREE'),
       'Free Plan',
       'Best to evaluate',
       0.00,
       'EUR',
       1,
       50,
       100,
       500,
       (select id from gendox_core.types where name = 'FREE_MODEL' and type_category = 'MODEL_TIER'),
       timezone('UTC', NOW()),
       timezone('UTC', NOW())
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.subscription_plans WHERE sku = 'gd-free-001');

-- Inserting Subscription for Basic Tier
INSERT INTO gendox_core.subscription_plans (sku, sku_type_id, name, description, price, currency, moq, user_upload_limit_file_count, user_upload_limit_mb, user_message_monthly_limit_count, ai_models_tier_type_id, created_at, updated_at)
SELECT
    'gd-basic-001',
    (SELECT id FROM gendox_core.types WHERE name = 'SKU_TYPE_BASIC'),
    'Basic Plan',
    'Basic Plan - Ideal for small websites, and individuals',
    20.00,
    'EUR',
    1,
    100,
    1000,
    5000,
    (select id from gendox_core.types where name = 'STANDARD_MODEL' and type_category = 'MODEL_TIER'),
    timezone('UTC', NOW()),
    timezone('UTC', NOW())
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.subscription_plans WHERE sku = 'gd-basic-001');

-- Inserting Subscription for Pro Tier
INSERT INTO gendox_core.subscription_plans (sku, sku_type_id, name, description, price, currency, moq, user_upload_limit_file_count, user_upload_limit_mb, user_message_monthly_limit_count, ai_models_tier_type_id, created_at, updated_at)
SELECT 'gd-pro-001',
       (SELECT id FROM gendox_core.types WHERE name = 'SKU_TYPE_PRO'),
       'Pro Plan',
       'Pro Plan Description - Ideal for big websites, and Teams',
       25.00,
       'EUR',
       5,
       1000,
       2000,
       10000,
       (select id from gendox_core.types where name = 'STANDARD_MODEL' and type_category = 'MODEL_TIER'),
       timezone('UTC', NOW()),
       timezone('UTC', NOW())
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.subscription_plans WHERE sku = 'gd-pro-001');

-- Inserting Subscription for Business Tier
INSERT INTO gendox_core.subscription_plans (sku, sku_type_id, name, description, price, currency, moq, user_upload_limit_file_count, user_upload_limit_mb, user_message_monthly_limit_count, ai_models_tier_type_id, created_at, updated_at)
SELECT 'gd-business-001',
       (SELECT id FROM gendox_core.types WHERE name = 'SKU_TYPE_BUSINESS'),
       'Business Plan',
       'Business Plan Description - Ideal for large organizations',
       40.00,
       'EUR',
       10,
       5000,
       4000,
       20000,
       (select id from gendox_core.types where name = 'CUSTOM_MODEL' and type_category = 'MODEL_TIER'),
       timezone('UTC', NOW()),
       timezone('UTC', NOW())
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.subscription_plans WHERE sku = 'gd-business-001');

-------------- INSERT SUBSCRIPTION  --------------
-----------------------------------------------------

-----------------------------------------------------
-------------- INSERT RATE LIMITS  --------------
-- Inserting Rate Limit for Free Tier
INSERT INTO gendox_core.api_rate_limits (tier_type_id, public_completions_per_minute, completions_per_minute, created_at, updated_at)
SELECT (SELECT id FROM gendox_core.types WHERE name = 'RATE_LIMIT_FREE'), 30, 60, timezone('UTC', NOW()), timezone('UTC', NOW())
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.api_rate_limits WHERE tier_type_id = (SELECT id FROM gendox_core.types WHERE name = 'RATE_LIMIT_FREE'));

-- Inserting Rate Limit for Basic Tier
INSERT INTO gendox_core.api_rate_limits (tier_type_id, public_completions_per_minute, completions_per_minute, created_at, updated_at)
SELECT (SELECT id FROM gendox_core.types WHERE name = 'RATE_LIMIT_BASIC'), 120, 300, timezone('UTC', NOW()), timezone('UTC', NOW())
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.api_rate_limits WHERE tier_type_id = (SELECT id FROM gendox_core.types WHERE name = 'RATE_LIMIT_BASIC'));

-- Inserting Rate Limit for Pro Tier
INSERT INTO gendox_core.api_rate_limits (tier_type_id, public_completions_per_minute, completions_per_minute, created_at, updated_at)
SELECT (SELECT id FROM gendox_core.types WHERE name = 'RATE_LIMIT_PRO'), 500, 1200, timezone('UTC', NOW()), timezone('UTC', NOW())
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.api_rate_limits WHERE tier_type_id = (SELECT id FROM gendox_core.types WHERE name = 'RATE_LIMIT_PRO'));

-- Inserting Rate Limit for Business Tier
INSERT INTO gendox_core.api_rate_limits (tier_type_id, public_completions_per_minute, completions_per_minute, created_at, updated_at)
SELECT (SELECT id FROM gendox_core.types WHERE name = 'RATE_LIMIT_BUSINESS'), 200, 1800, timezone('UTC', NOW()), timezone('UTC', NOW())
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.api_rate_limits WHERE tier_type_id = (SELECT id FROM gendox_core.types WHERE name = 'RATE_LIMIT_BUSINESS'));


-------------- INSERT RATE LIMITS  --------------
-----------------------------------------------------



-----------------------------------------------------
-------------- Connect ORG with an active plan  --------------

create table if not exists gendox_core.organization_plan
(
    id uuid default uuid_generate_v4(),
    organization_id uuid not null,
    subscription_plan_id uuid not null,
    api_rate_limit_id uuid not null,
    start_date timestamp not null,
    end_date timestamp,
    number_of_seats int not null,
    created_at timestamp not null,
    updated_at timestamp not null,
    primary key (id),
    foreign key (organization_id) references gendox_core.organizations(id),
    foreign key (subscription_plan_id) references gendox_core.subscription_plans(id)
);

create schema if not exists gendox_historic_data;

CREATE TABLE IF NOT EXISTS gendox_historic_data.organization_plan_history
(
    id uuid NOT NULL,
    organization_id uuid NOT NULL,
    subscription_plan_id uuid NOT NULL,
    api_rate_limit_id uuid NOT NULL,
    start_date timestamp NOT NULL,
    end_date timestamp,
    number_of_seats int NOT NULL,
    created_at timestamp NOT NULL,
    updated_at timestamp NOT NULL,
    recorded_at timestamp NOT NULL DEFAULT timezone('UTC', NOW()) -- additional column to record the timestamp
);

-- Create an index on the organization_id column if it does not already exist
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_class c
                     JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = 'idx_organization_id'
              AND n.nspname = 'gendox_historic_data'
        ) THEN
            CREATE INDEX idx_organization_id ON gendox_historic_data.organization_plan_history (organization_id);
        END IF;
    END $$;

-- create function to auto update historic table. This is also added in the repeatable migrations
CREATE OR REPLACE FUNCTION gendox_core.log_organization_plan_history()
    RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO gendox_historic_data.organization_plan_history (
        id,
        organization_id,
        subscription_plan_id,
        api_rate_limit_id,
        start_date,
        end_date,
        number_of_seats,
        created_at,
        updated_at,
        recorded_at
    )
    VALUES (
               NEW.id,
               NEW.organization_id,
               NEW.subscription_plan_id,
               NEW.api_rate_limit_id,
               NEW.start_date,
               NEW.end_date,
               NEW.number_of_seats,
               NEW.created_at,
               NEW.updated_at,
               timezone('UTC', NOW())
           );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trg_log_organization_plan_history ON gendox_core.organization_plan;


CREATE TRIGGER trg_log_organization_plan_history
    AFTER INSERT OR UPDATE ON gendox_core.organization_plan
    FOR EACH ROW
EXECUTE FUNCTION gendox_core.log_organization_plan_history();


-- migrate all existing organizations that dont have a plan to the pro plan, for 1 month
INSERT INTO gendox_core.organization_plan (organization_id,
                                           subscription_plan_id,
                                           api_rate_limit_id,
                                           start_date,
                                           end_date,
                                           number_of_seats,
                                           created_at,
                                           updated_at)
SELECT o.id,
       oup.id,
       arl.id,
       timezone('UTC', NOW()),
       timezone('UTC', NOW()) + INTERVAL '1 month',
       10,
       timezone('UTC', NOW()),
       timezone('UTC', NOW())
FROM gendox_core.organizations o
         LEFT JOIN gendox_core.organization_plan op ON op.organization_id = o.id
         JOIN gendox_core.subscription_plans oup ON oup.sku = 'gd-pro-001'
         JOIN gendox_core.api_rate_limits arl
              ON arl.tier_type_id = (SELECT id FROM gendox_core.types WHERE name = 'RATE_LIMIT_PRO')
WHERE op.id IS NULL;


-- Add tier type column in AI Models
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'gendox_core'
              AND table_name = 'ai_models'
              AND column_name = 'model_tier_type_id'
        ) THEN
            ALTER TABLE gendox_core.ai_models
                ADD COLUMN model_tier_type_id bigint,
                ADD FOREIGN KEY (model_tier_type_id) REFERENCES gendox_core.types (id);
        END IF;
    END $$;

-- Set default value to STANDARD_MODEL
UPDATE gendox_core.ai_models
SET model_tier_type_id = (SELECT id
                          FROM gendox_core.types
                          WHERE type_category = 'MODEL_TIER'
                            AND name = 'STANDARD_MODEL')
WHERE model_tier_type_id IS NULL;


-- Add organization_id column in AI Models
-- models that have organization_id as null are global models
-- models that have organization_id as not null are organization specific models
DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'gendox_core'
              AND table_name = 'ai_models'
              AND column_name = 'organization_id'
        ) THEN
            ALTER TABLE gendox_core.ai_models
                ADD COLUMN organization_id UUID NULL,
                ADD FOREIGN KEY (organization_id) REFERENCES gendox_core.organizations (id);
        END IF;
    END $$;


alter table gendox_core.organizations
    add column if not exists developer_email varchar(256) default null;

create table if not exists gendox_core.organization_model_keys
(
    id uuid default uuid_generate_v4(),
    organization_id uuid not null,
    ai_model_id uuid not null,
    model_key varchar(1024) not null,
    created_at timestamp not null,
    updated_at timestamp not null,
    primary key (id),
    foreign key (organization_id) references gendox_core.organizations(id),
    foreign key (ai_model_id) references gendox_core.ai_models(id)
);

INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_READ_ORGANIZATION_PLAN', 'Permission to edit organization plan'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE'
                   and name = 'OP_READ_ORGANIZATION_PLAN');


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_READ_ORGANIZATION_PLAN'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);
-------

-- Add This for completeness, ONLY the System and the Super Admin can update the organization plan
INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_EDIT_ORGANIZATION_PLAN', 'Permission to edit organization plan - System and Super Admin'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE'
                   and name = 'OP_EDIT_ORGANIZATION_PLAN');


------

INSERT into gendox_core.types
(type_category, name, description)
select 'ORGANIZATION_ROLE_PERMISSION_TYPE', 'OP_EDIT_ORGANIZATION_MODEL_KEYS', 'Permission to edit organization plan'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE'
                   and name = 'OP_EDIT_ORGANIZATION_MODEL_KEYS');


insert into gendox_core.role_permission (role_id, permission_id)
select r.id as role_id, p.id as permission_id
from gendox_core.types r, gendox_core.types p
where r.type_category = 'ORGANIZATION_ROLE_TYPE' and r.name = 'ROLE_ADMIN'
  and p.type_category = 'ORGANIZATION_ROLE_PERMISSION_TYPE' and p.name = 'OP_EDIT_ORGANIZATION_MODEL_KEYS'
  and not exists (select * from gendox_core.role_permission where role_id = r.id and permission_id = p.id);