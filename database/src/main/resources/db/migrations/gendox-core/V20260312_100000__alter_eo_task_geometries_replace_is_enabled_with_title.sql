-- This migration replaces the 'is_enabled' column with a 'title' column in the 'eo_task_geometries' table.
ALTER TABLE gendox_core.eo_task_geometries
    DROP COLUMN IF EXISTS is_enabled;

ALTER TABLE gendox_core.eo_task_geometries
    ADD COLUMN IF NOT EXISTS title VARCHAR(255);


