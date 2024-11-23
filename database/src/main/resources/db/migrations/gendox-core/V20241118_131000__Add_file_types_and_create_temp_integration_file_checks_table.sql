-- Create the API_INTEGRATION types if it doesn't exist
INSERT into gendox_core.types
(type_category, name, description)
select 'INTEGRATION_TYPE', 'API_INTEGRATION', 'API Integration'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'INTEGRATION_TYPE'
                   and name = 'API_INTEGRATION');


INSERT into gendox_core.types
(type_category, name, description)
select 'FILE_TYPE', 'PLAIN_TEXT_FILE', 'Plain Text File'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'FILE_TYPE'
                   and name = 'PLAIN_TEXT_FILE');

INSERT into gendox_core.types
(type_category, name, description)
select 'FILE_TYPE', 'PDF_FILE', 'PDF File'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'FILE_TYPE'
                   and name = 'PDF_FILE');

INSERT into gendox_core.types
(type_category, name, description)
select 'FILE_TYPE', 'API_INTEGRATION_FILE', 'API Integration File'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'FILE_TYPE'
                   and name = 'API_INTEGRATION_FILE');

INSERT into gendox_core.types
(type_category, name, description)
select 'FILE_TYPE', 'ADVANCED_PDF_FILE', 'Advanced PDF File'
where not exists(SELECT *
                 FROM gendox_core.types
                 where type_category = 'FILE_TYPE'
                   and name = 'ADVANCED_PDF_FILE');



-- Create columns if they don't exist
ALTER TABLE gendox_core.integrations
    ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Add the foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'gendox_core'
          AND tc.table_name = 'integrations'
          AND kcu.column_name = 'organization_id'
          AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE gendox_core.integrations
        ADD CONSTRAINT fk_organization
        FOREIGN KEY (organization_id)
        REFERENCES gendox_core.organizations(id);
    END IF;
END $$;

-- Drop the not null constraint
DO $$
BEGIN
    -- Check if the column `project_id` is NOT NULL
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'gendox_core'
          AND table_name = 'integrations'
          AND column_name = 'project_id'
          AND is_nullable = 'NO'
    ) THEN
        -- Drop the NOT NULL constraint if it exists
        ALTER TABLE gendox_core.integrations
            ALTER COLUMN project_id DROP NOT NULL;
    END IF;
END $$;



-- Create the temp_integration_file_checks table
CREATE TABLE IF NOT EXISTS gendox_core.temp_integration_file_checks
(
    id uuid DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    integration_id UUID NOT NULL,
    content_id BIGINT not null UNIQUE,
    external_url VARCHAR(255),
    remote_url VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    file_type_id bigint NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (project_id) REFERENCES gendox_core.projects (id),
    FOREIGN KEY (integration_id) REFERENCES gendox_core.integrations (id),
    FOREIGN KEY (file_type_id) REFERENCES gendox_core.types (id)
);
comment on table gendox_core.api_keys is 'Table to store temporary integration file checks';

-- Create the column if it doesn't exist in the document_instance table
ALTER TABLE gendox_core.document_instance
    ADD COLUMN IF NOT EXISTS content_id BIGINT;

-- Add the foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'gendox_core'
          AND tc.table_name = 'document_instance'
          AND kcu.column_name = 'content_id'
          AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE gendox_core.document_instance
        ADD CONSTRAINT fk_content_id
        FOREIGN KEY (content_id)
        REFERENCES gendox_core.temp_integration_file_checks(content_id);
    END IF;
END $$;

-- Create the column if it doesn't exist in the document_instance table
ALTER TABLE gendox_core.document_instance
    ADD COLUMN IF NOT EXISTS file_type_id BIGINT;

-- Add the foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'gendox_core'
          AND tc.table_name = 'document_instance'
          AND kcu.column_name = 'file_type_id'
          AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE gendox_core.document_instance
        ADD CONSTRAINT fk_file_type_id
        FOREIGN KEY (file_type_id)
        REFERENCES gendox_core.types(id);
    END IF;
END $$;

-- Create the column if it doesn't exist in the document_instance table
ALTER TABLE gendox_core.document_instance
    ADD COLUMN IF NOT EXISTS external_url VARCHAR(255);

