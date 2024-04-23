DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'gendox_core'
        AND table_name = 'projects'
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE gendox_core.projects
        ADD COLUMN created_by UUID,
        ADD FOREIGN KEY (created_by) REFERENCES gendox_core.users (id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'gendox_core'
        AND table_name = 'projects'
        AND column_name = 'updated_by'
    ) THEN
        ALTER TABLE gendox_core.projects
        ADD COLUMN updated_by UUID,
        ADD FOREIGN KEY (updated_by) REFERENCES gendox_core.users (id);
    END IF;


    IF NOT EXISTS (
         SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'gendox_core'
         AND table_name = 'project_agent'
         AND column_name = 'created_by'
    ) THEN
         ALTER TABLE gendox_core.project_agent
         ADD COLUMN created_by UUID,
         ADD FOREIGN KEY (created_by) REFERENCES gendox_core.users (id);
    END IF;

    IF NOT EXISTS (
         SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'gendox_core'
         AND table_name = 'project_agent'
         AND column_name = 'updated_by'
    ) THEN
         ALTER TABLE gendox_core.project_agent
         ADD COLUMN updated_by UUID,
         ADD FOREIGN KEY (updated_by) REFERENCES gendox_core.users (id);
    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'gendox_core'
        AND table_name = 'organizations'
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE gendox_core.organizations
        ADD COLUMN created_by UUID,
        ADD FOREIGN KEY (created_by) REFERENCES gendox_core.users (id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'gendox_core'
        AND table_name = 'organizations'
        AND column_name = 'updated_by'
    ) THEN
        ALTER TABLE gendox_core.organizations
        ADD COLUMN updated_by UUID,
        ADD FOREIGN KEY (updated_by) REFERENCES gendox_core.users (id);
    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'gendox_core'
        AND table_name = 'document_template'
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE gendox_core.document_template
        ADD COLUMN created_by UUID,
        ADD FOREIGN KEY (created_by) REFERENCES gendox_core.users (id);
    END IF;

    IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'gendox_core'
            AND table_name = 'document_template'
            AND column_name = 'updated_by'
    ) THEN
            ALTER TABLE gendox_core.document_template
            ADD COLUMN updated_by UUID,
            ADD FOREIGN KEY (updated_by) REFERENCES gendox_core.users (id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'gendox_core'
        AND table_name = 'document_section_metadata'
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE gendox_core.document_section_metadata
        ADD COLUMN created_by UUID,
        ADD FOREIGN KEY (created_by) REFERENCES gendox_core.users (id);
    END IF;

    IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'gendox_core'
            AND table_name = 'document_section_metadata'
            AND column_name = 'updated_by'
    ) THEN
            ALTER TABLE gendox_core.document_section_metadata
            ADD COLUMN updated_by UUID,
            ADD FOREIGN KEY (updated_by) REFERENCES gendox_core.users (id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'gendox_core'
        AND table_name = 'document_instance'
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE gendox_core.document_instance
        ADD COLUMN created_by UUID,
        ADD FOREIGN KEY (created_by) REFERENCES gendox_core.users (id);
    END IF;

    IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'gendox_core'
            AND table_name = 'document_instance'
            AND column_name = 'updated_by'
    ) THEN
            ALTER TABLE gendox_core.document_instance
            ADD COLUMN updated_by UUID,
            ADD FOREIGN KEY (updated_by) REFERENCES gendox_core.users (id);
    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'gendox_core'
        AND table_name = 'document_instance_sections'
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE gendox_core.document_instance_sections
        ADD COLUMN created_by UUID,
        ADD FOREIGN KEY (created_by) REFERENCES gendox_core.users (id);
    END IF;

    IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'gendox_core'
            AND table_name = 'document_instance_sections'
            AND column_name = 'updated_by'
    ) THEN
            ALTER TABLE gendox_core.document_instance_sections
            ADD COLUMN updated_by UUID,
            ADD FOREIGN KEY (updated_by) REFERENCES gendox_core.users (id);
    END IF;

END $$;


ALTER TABLE IF EXISTS gendox_core.document_instance
DROP COLUMN IF EXISTS user_id,
    ADD COLUMN  IF NOT EXISTS remote_url text;


ALTER TABLE IF EXISTS gendox_core.document_instance_sections
DROP COLUMN IF EXISTS remote_url;





