ALTER TABLE gendox_core.project_agent
    ADD COLUMN IF NOT EXISTS auto_digitization BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE gendox_core.tasks
    ADD COLUMN IF NOT EXISTS use_printed_page BOOLEAN,
    ADD COLUMN IF NOT EXISTS use_page_text BOOLEAN;

COMMENT ON COLUMN gendox_core.tasks.use_printed_page IS 'Digitization only: render page to image and send to LLM';
COMMENT ON COLUMN gendox_core.tasks.use_page_text IS 'Digitization only: send extracted text to LLM; icons not included';

UPDATE gendox_core.tasks t
SET use_printed_page = TRUE
FROM gendox_core.types tt
WHERE t.task_type_id = tt.id
  AND tt.type_category = 'TASK_TYPE'
  AND tt.name = 'DOCUMENT_DIGITIZATION'
  AND COALESCE(t.use_printed_page, FALSE) = FALSE
  AND COALESCE(t.use_page_text, FALSE) = FALSE;
