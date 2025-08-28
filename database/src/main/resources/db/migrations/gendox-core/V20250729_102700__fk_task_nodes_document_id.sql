-- Clean up task_nodes with invalid document_id references, orphaned task_nodes
UPDATE gendox_core.task_nodes n
SET document_id = NULL
WHERE n.document_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM gendox_core.document_instance d
    WHERE d.id = n.document_id
  );

-- Add the foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'gendox_core'
          AND tc.table_name = 'task_nodes'
          AND tc.constraint_name = 'fk_task_nodes_document_id'
    ) THEN
        ALTER TABLE gendox_core.task_nodes
        ADD CONSTRAINT fk_task_nodes_document_id
        FOREIGN KEY (document_id) REFERENCES gendox_core.document_instance(id);
    END IF;
END$$;
