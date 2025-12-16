
CREATE INDEX IF NOT EXISTS idx_dis_document_instance_id
    ON gendox_core.document_instance_sections (document_instance_id);


CREATE INDEX IF NOT EXISTS idx_embedding_group_section_id
    ON gendox_core.embedding_group (section_id);


CREATE INDEX IF NOT EXISTS idx_embedding_section_id
    ON gendox_core.embedding (section_id);


CREATE INDEX IF NOT EXISTS idx_embedding_group_embedding_id
    ON gendox_core.embedding_group (embedding_id);



CREATE INDEX IF NOT EXISTS idx_dis_document_section_metadata_id
    ON gendox_core.document_instance_sections (document_section_metadata_id);


CREATE INDEX IF NOT EXISTS idx_message_section_section_id
    ON gendox_core.message_section (section_id);
