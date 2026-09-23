-- Finds a document's answer to a question (Document Insights: filter and sort by answer).
-- The expressions must match TaskNodePredicates.nodeValueText() exactly for the index to be used.
CREATE INDEX IF NOT EXISTS idx_nodes_answer_lookup
    ON gendox_core.task_nodes (task_id,
                               jsonb_extract_path_text(node_value, 'nodeDocumentId'),
                               jsonb_extract_path_text(node_value, 'nodeQuestionId'));
