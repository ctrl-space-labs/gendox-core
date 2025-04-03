-- Add new columns for organization plans status
ALTER TABLE gendox_core.organization_plan
    ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT 'ACTIVE';


-- Set status to ACTIVE for all existing organization plans
UPDATE gendox_core.organization_plan
SET status = 'ACTIVE'
WHERE status IS NULL;
