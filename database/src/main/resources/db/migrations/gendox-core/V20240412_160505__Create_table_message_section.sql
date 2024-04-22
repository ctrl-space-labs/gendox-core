-- create message_section table if not exists
CREATE TABLE IF NOT EXISTS gendox_core.message_section
(
    id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id uuid,
    section_id uuid,
    document_id uuid,
    section_url  VARCHAR(255),
    created_at timestamp,
    updated_at timestamp,
    created_by uuid,
    updated_by uuid,
    FOREIGN KEY (message_id) REFERENCES gendox_core.message (id),
    FOREIGN KEY (section_id) REFERENCES gendox_core.document_instance_sections (id),
    FOREIGN KEY (document_id) REFERENCES gendox_core.document_instance (id)
    );