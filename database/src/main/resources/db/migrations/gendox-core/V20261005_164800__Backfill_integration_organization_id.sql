-- Every integration belongs to an organization: both the listing of integrations and
-- the manual "reload content" trigger filter by it. Rows created through POST /integrations
-- carried only a project, so they were invisible to the first and skipped by the second
-- while the scheduled poller kept running them.
--
-- A project belongs to exactly one organization, so the value is derived, never guessed.

UPDATE gendox_core.integrations i
SET organization_id = p.organization_id
    FROM gendox_core.projects p
WHERE p.id = i.project_id
  AND i.organization_id IS NULL;


COMMENT ON COLUMN gendox_core.integrations.run_interval_minutes
    IS 'Shortest gap between two runs, in minutes. NULL means every pass of the poller. Use is_active to stop it running at all.';