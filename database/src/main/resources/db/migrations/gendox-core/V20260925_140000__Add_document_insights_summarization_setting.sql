ALTER TABLE gendox_core.tasks
    ADD COLUMN IF NOT EXISTS summarization_enabled BOOLEAN;

-- Preserve the current behavior for existing Document Insights tasks.
UPDATE gendox_core.tasks task
SET summarization_enabled = TRUE
FROM gendox_core.types task_type
WHERE task.task_type_id = task_type.id
  AND task_type.type_category = 'TASK_TYPE'
  AND task_type.name = 'DOCUMENT_INSIGHTS'
  AND task.summarization_enabled IS NULL;

-- Summarization is disabled by default for every task created after this migration.
UPDATE gendox_core.tasks
SET summarization_enabled = FALSE
WHERE summarization_enabled IS NULL;

ALTER TABLE gendox_core.tasks
    ALTER COLUMN summarization_enabled SET DEFAULT FALSE,
    ALTER COLUMN summarization_enabled SET NOT NULL;

COMMENT ON COLUMN gendox_core.tasks.summarization_enabled
    IS 'Document Insights only: generate a summary from the answers for each document';
