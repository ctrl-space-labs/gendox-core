ALTER TABLE IF EXISTS gendox_core.document_instance
    ADD COLUMN IF NOT EXISTS number_of_pages INTEGER;

ALTER TABLE IF EXISTS gendox_core.task_nodes
    DROP COLUMN IF EXISTS page_number;