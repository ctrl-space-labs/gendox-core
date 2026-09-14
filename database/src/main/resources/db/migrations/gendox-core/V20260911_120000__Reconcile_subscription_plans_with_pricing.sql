-- Align the subscription plans with what https://gendox.dev/pricing sells.
--
-- Convention (unchanged): 9999 means "unlimited". All limits are per seat and
-- are multiplied by organization_plan.number_of_seats at check time.


-----------------------------------------------------
-------------- NEW PLAN LIMIT COLUMNS  --------------

ALTER TABLE IF EXISTS gendox_core.subscription_plans
    ADD COLUMN IF NOT EXISTS project_limit INT NOT NULL DEFAULT 9999;

ALTER TABLE IF EXISTS gendox_core.subscription_plans
    ADD COLUMN IF NOT EXISTS document_pages_limit INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN gendox_core.subscription_plans.project_limit
    IS 'Max number of active projects a user can create. 9999 is the Fair Usage Policy for unlimited.';

COMMENT ON COLUMN gendox_core.subscription_plans.document_pages_limit
    IS 'Max total number of document pages a user can upload. Safeguard against a few huge documents consuming the whole document allowance; sized at ~50 pages per allowed document.';

-------------- NEW PLAN LIMIT COLUMNS  --------------
-----------------------------------------------------


-----------------------------------------------------
-------------- RE-SEED SUBSCRIPTION PLANS  --------------

-- Free Plan: 200 responses / month, 50 documents, up to 3 projects
UPDATE gendox_core.subscription_plans
SET price                             = 0.00,
    moq                               = 1,
    user_message_monthly_limit_count  = 200,
    user_upload_limit_file_count      = 50,
    user_upload_limit_mb              = 100,
    document_pages_limit              = 2500,
    project_limit                     = 3,
    updated_at                        = timezone('UTC', NOW())
WHERE sku = 'gd-free-001';

-- Basic Plan: 1000 responses / month, 100 documents, unlimited projects
UPDATE gendox_core.subscription_plans
SET price                             = 25.00,
    moq                               = 1,
    user_message_monthly_limit_count  = 1000,
    user_upload_limit_file_count      = 100,
    user_upload_limit_mb              = 1000,
    document_pages_limit              = 5000,
    project_limit                     = 9999,
    updated_at                        = timezone('UTC', NOW())
WHERE sku = 'gd-basic-001';

-- Pro Plan: 2000 responses / month, 500 documents, unlimited projects, min 3 seats
UPDATE gendox_core.subscription_plans
SET price                             = 45.00,
    moq                               = 3,
    user_message_monthly_limit_count  = 2000,
    user_upload_limit_file_count      = 500,
    user_upload_limit_mb              = 2000,
    document_pages_limit              = 25000,
    project_limit                     = 9999,
    updated_at                        = timezone('UTC', NOW())
WHERE sku = 'gd-pro-001';

-- Business Plan: 3x Pro, direct sale, min 10 seats
UPDATE gendox_core.subscription_plans
SET price                             = 99.00,
    moq                               = 10,
    user_message_monthly_limit_count  = 6000,
    user_upload_limit_file_count      = 1500,
    user_upload_limit_mb              = 6000,
    document_pages_limit              = 75000,
    project_limit                     = 9999,
    updated_at                        = timezone('UTC', NOW())
WHERE sku = 'gd-business-001';

-------------- RE-SEED SUBSCRIPTION PLANS  --------------
-----------------------------------------------------


-----------------------------------------------------
-------------- MISSING CUSTOM RATE LIMIT  --------------
-- Rate limits for custom plans, seeded with the Pro values.

INSERT INTO gendox_core.api_rate_limits (tier_type_id, public_completions_per_minute, completions_per_minute, created_at, updated_at)
SELECT (SELECT id FROM gendox_core.types WHERE name = 'RATE_LIMIT_CUSTOM'), 500, 1200, timezone('UTC', NOW()), timezone('UTC', NOW())
WHERE NOT EXISTS (SELECT 1 FROM gendox_core.api_rate_limits WHERE tier_type_id = (SELECT id FROM gendox_core.types WHERE name = 'RATE_LIMIT_CUSTOM'));

-------------- MISSING CUSTOM RATE LIMIT  --------------
-----------------------------------------------------


-----------------------------------------------------
-------------- DOCUMENT PAGES INDEX  --------------
-- Supports the per-organization page sum used by the document-pages check.

CREATE INDEX IF NOT EXISTS idx_document_instance_organization_id
    ON gendox_core.document_instance (organization_id);

-- The page sum excludes chat attachments by document id.
CREATE INDEX IF NOT EXISTS idx_chat_thread_documents_document_id
    ON gendox_core.chat_thread_documents (document_id);

-------------- DOCUMENT PAGES INDEX  --------------
-----------------------------------------------------
