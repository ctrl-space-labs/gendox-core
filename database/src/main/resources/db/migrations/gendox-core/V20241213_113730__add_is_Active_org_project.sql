ALTER TABLE gendox_core.organizations
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

ALTER TABLE gendox_core.projects
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
