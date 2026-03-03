CREATE TABLE IF NOT EXISTS chat_thread_documents
(
    id          bigserial PRIMARY KEY,
    document_id UUID      NOT NULL,
    project_id  UUID      NOT NULL,
    thread_id   UUID,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now(),
    created_by  UUID,
    updated_by  UUID,

    CONSTRAINT fk_project_id
        FOREIGN KEY (project_id)
            REFERENCES gendox_core.projects (id)
            ON DELETE CASCADE,


    CONSTRAINT fk_user_id
        FOREIGN KEY (created_by)
            REFERENCES gendox_core.users (id),

    CONSTRAINT fk_document_id
        FOREIGN KEY (document_id)
            REFERENCES gendox_core.document_instance (id)
            ON DELETE CASCADE,

    CONSTRAINT fk_thread_id
        FOREIGN KEY (thread_id)
            REFERENCES gendox_core.chat_thread (id)
            ON DELETE CASCADE
);

COMMENT ON TABLE gendox_core.chat_thread_documents
    IS 'Table that stores uploaded by the user, usually in a chat thread. The thread id can be null since the user can first upload a document and then send the message that will create the actual thread. These documents are not included in the project documents since they are not in the Knowledge base.';

COMMENT ON COLUMN gendox_core.chat_thread_documents.document_id
    IS 'The document that was uploaded.';

COMMENT ON COLUMN gendox_core.chat_thread_documents.project_id
    IS 'The project/agent to which was uploaded.';


COMMENT ON COLUMN gendox_core.chat_thread_documents.thread_id
    IS 'The thread that the document was uploaded. It can be null, if a user uploads a document in the new thread, before send the message. In this case, the thread has not created yet. When the thread is created this document will be also visible in the message attachments.';


WITH base AS (SELECT mlc.document_id,
                     m.thread_id,
                     m.project_id,
                     COALESCE(mlc.created_at, m.created_at) AS event_created_at,
                     COALESCE(mlc.updated_at, m.updated_at) AS event_updated_at,
                     COALESCE(mlc.created_by, m.created_by) AS event_created_by,
                     COALESCE(mlc.updated_by, m.updated_by) AS event_updated_by
              FROM gendox_core.message_local_context mlc
                       JOIN gendox_core.message m
                            ON m.id = mlc.message_id
              WHERE mlc.document_id IS NOT NULL
                AND m.thread_id IS NOT NULL
                AND m.project_id IS NOT NULL),
     ranked AS (SELECT b.*,
                       first_value(event_created_at) OVER w_asc  AS created_at,
                       first_value(event_created_by) OVER w_asc  AS created_by,
                       first_value(event_updated_at) OVER w_desc AS updated_at,
                       first_value(event_updated_by) OVER w_desc AS updated_by
                FROM base b
                WINDOW w_asc AS (PARTITION BY document_id, thread_id, project_id
                        ORDER BY event_created_at ASC, event_created_by NULLS LAST),
                       w_desc AS (PARTITION BY document_id, thread_id, project_id
                               ORDER BY event_updated_at DESC, event_updated_by NULLS LAST)),
     final_rows AS (SELECT DISTINCT ON (document_id, thread_id, project_id) document_id,
                                                                            thread_id,
                                                                            project_id,
                                                                            created_at,
                                                                            updated_at,
                                                                            created_by,
                                                                            updated_by
                    FROM ranked
                    ORDER BY document_id, thread_id, project_id)
INSERT
INTO gendox_core.chat_thread_documents (document_id,
                                        project_id,
                                        thread_id,
                                        created_at,
                                        updated_at,
                                        created_by,
                                        updated_by)
SELECT f.document_id,
       f.project_id,
       f.thread_id,
       COALESCE(f.created_at, now()),
       COALESCE(f.updated_at, now()),
       f.created_by,
       f.updated_by
FROM final_rows f
WHERE NOT EXISTS (SELECT 1
                  FROM gendox_core.chat_thread_documents ctd
                  WHERE ctd.document_id = f.document_id
                    AND ctd.thread_id = f.thread_id
                    AND ctd.project_id = f.project_id);


-- INSERT into gendox_core.types
--     (type_category, name, description)
-- select 'PROJECT_DOCUMENT_TYPE',
--        'KNOWLEDGE_BASE',
--        'Knowledge base used across all project'
-- where not exists(SELECT *
--                  FROM gendox_core.types
--                  where type_category = 'PROJECT_DOCUMENT_TYPE'
--                    and name = 'KNOWLEDGE_BASE');
--
-- INSERT into gendox_core.types
--     (type_category, name, description)
-- select 'PROJECT_DOCUMENT_TYPE',
--        'THREAD_ATTACHMENT',
--        'Document uploaded as attachment in a chat thread, only visible to thread participants'
-- where not exists(SELECT *
--                  FROM gendox_core.types
--                  where type_category = 'PROJECT_DOCUMENT_TYPE'
--                    and name = 'THREAD_ATTACHMENT');


-- set default values for existing records
-- set default values for existing records (only where document_type_id IS NULL)
-- WITH type_ids AS (
--     SELECT
--         (SELECT id
--          FROM gendox_core.types
--          WHERE type_category = 'PROJECT_DOCUMENT_TYPE'
--            AND name = 'THREAD_ATTACHMENT'
--          ORDER BY id
--          LIMIT 1) AS thread_type_id,
--         (SELECT id
--          FROM gendox_core.types
--          WHERE type_category = 'PROJECT_DOCUMENT_TYPE'
--            AND name = 'KNOWLEDGE_BASE'
--          ORDER BY id
--          LIMIT 1) AS kb_type_id
-- ),
--      mlc_docs AS (
--          SELECT DISTINCT document_id
--          FROM gendox_core.message_local_context
--      ),
--      desired AS (
--          SELECT
--              pd.id AS project_document_id,
--              CASE
--                  WHEN md.document_id IS NOT NULL THEN t.thread_type_id
--                  ELSE t.kb_type_id
--                  END AS desired_type_id
--          FROM gendox_core.project_documents pd
--                   CROSS JOIN type_ids t
--                   LEFT JOIN mlc_docs md
--                             ON md.document_id = pd.document_id
--          WHERE pd.document_type_id IS NULL
--      )
-- UPDATE gendox_core.project_documents pd
-- SET document_type_id = d.desired_type_id
-- FROM desired d
-- WHERE pd.id = d.project_document_id;
