ALTER TABLE gendox_core.audit_logs
ADD COLUMN IF NOT EXISTS organization_id UUID;

ALTER TABLE gendox_core.audit_logs
ADD COLUMN IF NOT EXISTS trace_id text;

ALTER TABLE gendox_core.audit_logs
ADD COLUMN IF NOT EXISTS span_id text;

ALTER TABLE gendox_core.audit_logs
DROP COLUMN IF EXISTS request_id;
