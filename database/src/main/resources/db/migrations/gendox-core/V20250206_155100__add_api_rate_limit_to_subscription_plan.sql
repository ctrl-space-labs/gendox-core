-- Add the api_rate_limit_id column if it does not exist
ALTER TABLE gendox_core.subscription_plans
    ADD COLUMN IF NOT EXISTS api_rate_limit_id UUID;

-- Add the foreign key constraint to ensure referential integrity
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'gendox_core'
          AND table_name = 'subscription_plans'
          AND constraint_name = 'fk_subscription_plans_api_rate_limit'
    ) THEN
        ALTER TABLE gendox_core.subscription_plans
            ADD CONSTRAINT fk_subscription_plans_api_rate_limit
            FOREIGN KEY (api_rate_limit_id)
            REFERENCES gendox_core.api_rate_limits (id);
    END IF;
END $$;


-- Update subscription_plans to associate with the correct api_rate_limits
UPDATE gendox_core.subscription_plans sp
SET api_rate_limit_id = (
    SELECT arl.id
    FROM gendox_core.api_rate_limits arl
    JOIN gendox_core.types rate_type ON arl.tier_type_id = rate_type.id
    JOIN gendox_core.types sku_type ON sp.sku_type_id = sku_type.id
    WHERE rate_type.type_category = 'RATE_LIMIT'
      AND sku_type.type_category = 'SUBSCRIPTION_SKU_TYPE'
      AND (
          (sku_type.name = 'SKU_TYPE_FREE' AND rate_type.name = 'RATE_LIMIT_FREE') OR
          (sku_type.name = 'SKU_TYPE_BASIC' AND rate_type.name = 'RATE_LIMIT_BASIC') OR
          (sku_type.name = 'SKU_TYPE_PRO' AND rate_type.name = 'RATE_LIMIT_PRO') OR
          (sku_type.name = 'SKU_TYPE_BUSINESS' AND rate_type.name = 'RATE_LIMIT_BUSINESS') OR
          (sku_type.name = 'SKU_TYPE_CUSTOM' AND rate_type.name = 'RATE_LIMIT_CUSTOM')
      )
)
WHERE api_rate_limit_id IS NULL;



-- Step 4: Now enforce the NOT NULL constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'gendox_core'
          AND table_name = 'subscription_plans'
          AND column_name = 'api_rate_limit_id'
          AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE gendox_core.subscription_plans
            ALTER COLUMN api_rate_limit_id SET NOT NULL;
    END IF;
END $$;


