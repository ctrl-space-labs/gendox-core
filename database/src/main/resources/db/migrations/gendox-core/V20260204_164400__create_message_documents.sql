-- Message ↔ Document attachments (many documents per message)
CREATE TABLE IF NOT EXISTS gendox_core.message_documents (
    id UUID NOT NULL,
    message_id UUID NOT NULL,
    document_id UUID NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    PRIMARY KEY (id),
    FOREIGN KEY (message_id) REFERENCES gendox_core.message(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES gendox_core.document_instance(id) ON DELETE CASCADE,
    UNIQUE (message_id, document_id)
    );

-- Fast lookup by message
CREATE INDEX IF NOT EXISTS idx_message_documents_message_id
    ON gendox_core.message_documents(message_id);

-- Fast lookup by document
CREATE INDEX IF NOT EXISTS idx_message_documents_document_id
    ON gendox_core.message_documents(document_id);

