ALTER TABLE gendox_core.embedding ADD COLUMN IF NOT EXISTS project_id uuid;
ALTER TABLE gendox_core.embedding ADD COLUMN IF NOT EXISTS organization_id uuid;
ALTER TABLE gendox_core.embedding ADD COLUMN IF NOT EXISTS section_id uuid;
ALTER TABLE gendox_core.embedding ADD COLUMN IF NOT EXISTS message_id uuid;
ALTER TABLE gendox_core.embedding ADD COLUMN IF NOT EXISTS semantic_search_model_id uuid;




WITH data_to_update AS (
    SELECT
        ec.id AS embedding_id,
        eg.semantic_search_model_id,
        eg.section_id,
        eg.message_id,
        COALESCE(
            -- Use section if section_id is not null
                pd.project_id,
            -- Fallback to message if section_id is null
                m.project_id
        ) AS project_id,
        COALESCE(
            -- Use section's organization_id if section_id is not null
                di.organization_id,
            -- Fallback to message's organization_id if section_id is null
                p.organization_id
        ) AS organization_id
    FROM gendox_core.embedding ec
             JOIN gendox_core.embedding_group eg ON ec.id = eg.embedding_id
             LEFT JOIN gendox_core.document_instance_sections s ON eg.section_id = s.id
             LEFT JOIN gendox_core.project_documents pd ON s.document_instance_id = pd.document_id
             LEFT JOIN gendox_core.document_instance di ON s.document_instance_id = di.id
             LEFT JOIN gendox_core.message m ON eg.message_id = m.id
             LEFT JOIN gendox_core.projects p ON m.project_id = p.id
    WHERE ec.project_id IS NULL
)
-- Perform the update
UPDATE gendox_core.embedding ec
SET semantic_search_model_id = d.semantic_search_model_id,
    project_id = d.project_id,
    organization_id = d.organization_id,
    section_id = d.section_id,
    message_id = d.message_id
FROM data_to_update d
WHERE ec.id = d.embedding_id;

DO $$
    BEGIN
        -- Check if the column type is vector(1536) specifically
        IF EXISTS (
            SELECT a.*
            FROM pg_attribute AS a
                     JOIN pg_class AS c ON a.attrelid = c.oid
                     JOIN pg_namespace AS n ON c.relnamespace = n.oid
                     JOIN pg_type AS t ON a.atttypid = t.oid
            WHERE n.nspname = 'gendox_core'
              AND c.relname = 'embedding'
              AND a.attname = 'embedding_vector'
              AND t.typname = 'vector'
              AND a.atttypmod = 1536
        ) THEN
            -- Alter the column to remove the length specification
            ALTER TABLE gendox_core.embedding
                ALTER COLUMN embedding_vector TYPE vector;
        END IF;
    END $$;


-- -- Create partial index in a project
-- CREATE INDEX hnsw_l2_idx_proj_cc97cde1_7c35_41ea_96ea_dfd4bb12fd56
--     ON gendox_core.embedding
--         USING hnsw ((embedding_vector::vector(1536)) vector_l2_ops)
--     WITH (
--     m = 16,
--     ef_construction = 64
--     )
--     WHERE project_id = 'cc97cde1-7c35-41ea-96ea-dfd4bb12fd56'
--         and section_id is not null
--         and semantic_search_model_id = '8bf357c8-dd63-4632-a578-fe3f78e17e1b';







