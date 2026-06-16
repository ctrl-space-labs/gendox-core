-- Drop old table (and dependent objects)
DROP TABLE IF EXISTS gendox_core.message_documents CASCADE;

-- Recreate table
CREATE TABLE IF NOT EXISTS gendox_core.message_local_context (
    id UUID NOT NULL,
    message_id UUID NOT NULL,
    document_id UUID,
    context_type_name TEXT NOT NULL,
    value TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    PRIMARY KEY (id),
    FOREIGN KEY (message_id) REFERENCES gendox_core.message(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES gendox_core.document_instance(id) ON DELETE CASCADE
);

-- Fast lookup by message
CREATE INDEX IF NOT EXISTS idx_message_local_context_message_id
    ON gendox_core.message_local_context(message_id);

-- Fast lookup by document
CREATE INDEX IF NOT EXISTS idx_message_local_context_document_id
    ON gendox_core.message_local_context(document_id);