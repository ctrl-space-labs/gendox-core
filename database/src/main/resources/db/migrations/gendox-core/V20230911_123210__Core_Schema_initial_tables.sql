ALTER TABLE IF EXISTS gendox_core.projects
    ADD COLUMN IF NOT EXISTS created_by uuid,
    ADD COLUMN IF NOT EXISTS updated_by uuid,
    ADD FOREIGN KEY (created_by) REFERENCES gendox_core.users (id),
    ADD FOREIGN KEY (updated_by) REFERENCES gendox_core.users (id);

ALTER TABLE IF EXISTS gendox_core.project_agent
    ADD COLUMN IF NOT EXISTS created_by uuid,
    ADD COLUMN IF NOT EXISTS updated_by uuid,
    ADD FOREIGN KEY (created_by) REFERENCES gendox_core.users (id),
    ADD FOREIGN KEY (updated_by) REFERENCES gendox_core.users (id);

ALTER TABLE IF EXISTS gendox_core.organizations
    ADD COLUMN IF NOT EXISTS created_by uuid,
    ADD COLUMN IF NOT EXISTS updated_by uuid,
    ADD FOREIGN KEY (created_by) REFERENCES gendox_core.users (id),
    ADD FOREIGN KEY (updated_by) REFERENCES gendox_core.users (id);

ALTER TABLE IF EXISTS gendox_core.document_template
    ADD COLUMN IF NOT EXISTS created_by uuid,
    ADD COLUMN IF NOT EXISTS updated_by uuid,
    ADD FOREIGN KEY (created_by) REFERENCES gendox_core.users (id),
    ADD FOREIGN KEY (updated_by) REFERENCES gendox_core.users (id);

ALTER TABLE IF EXISTS gendox_core.document_section_metadata
    ADD COLUMN IF NOT EXISTS created_by uuid,
    ADD COLUMN IF NOT EXISTS updated_by uuid,
    ADD FOREIGN KEY (created_by) REFERENCES gendox_core.users (id),
    ADD FOREIGN KEY (updated_by) REFERENCES gendox_core.users (id);

ALTER TABLE IF EXISTS gendox_core.document_instance
DROP COLUMN IF EXISTS user_id,
    ADD COLUMN  IF NOT EXISTS remote_url text,
    ADD COLUMN IF NOT EXISTS created_by uuid,
    ADD COLUMN IF NOT EXISTS updated_by uuid,
    ADD FOREIGN KEY (created_by) REFERENCES gendox_core.users (id),
    ADD FOREIGN KEY (updated_by) REFERENCES gendox_core.users (id);

ALTER TABLE IF EXISTS gendox_core.document_instance_sections
DROP COLUMN IF EXISTS remote_url,
    ADD COLUMN IF NOT EXISTS created_by uuid,
    ADD COLUMN IF NOT EXISTS updated_by uuid,
    ADD FOREIGN KEY (created_by) REFERENCES gendox_core.users (id),
    ADD FOREIGN KEY (updated_by) REFERENCES gendox_core.users (id);




