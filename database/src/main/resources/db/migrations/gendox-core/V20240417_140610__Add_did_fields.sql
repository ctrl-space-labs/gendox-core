ALTER TABLE gendox_core.organization_dids
ADD COLUMN IF NOT EXISTS web_domain TEXT,
ADD COLUMN IF NOT EXISTS web_path TEXT;
