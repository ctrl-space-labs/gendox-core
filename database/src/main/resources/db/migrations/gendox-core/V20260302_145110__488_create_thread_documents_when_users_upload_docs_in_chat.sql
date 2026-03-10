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


INSERT INTO gendox_core.types (type_category, name, description)
SELECT
    'AI_TOOL_EXAMPLES',
    'APPLY_RANGE_PATCH',
    $${
          "name": "apply_range_patch",
          "strict": true,
          "parameters": {
            "type": "object",
            "required": [
              "document_id",
              "start_line",
              "end_line",
              "new_text",
              "summary"
            ],
            "properties": {
              "summary": {
                "type": "string",
                "description": "A short summary explaining the purpose of the modification"
              },
              "end_line": {
                "type": "integer",
                "description": "The last line number in the current document to replace, inclusive"
              },
              "new_text": {
                "type": "string",
                "description": "The exact replacement text for the specified line range. Use an empty string to delete the selected lines."
              },
              "start_line": {
                "type": "integer",
                "description": "The first line number in the current document to replace"
              },
              "document_id": {
                "type": "string",
                "description": "The UUID of the document to update"
              }
            },
            "additionalProperties": false
          },
          "description": "Function that applies a single line-range edit to an existing document and persists the updated content. The edit replaces the lines from start_line through end_line, inclusive, with new_text. If multiple changes are needed, multiple tool calls should be issued."
        }$$
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'AI_TOOL_EXAMPLES'
      AND name = 'APPLY_RANGE_PATCH'
);




INSERT INTO gendox_core.types (type_category, name, description)
SELECT
    'AI_TOOL_EXAMPLES',
    'EXECUTE_COMMAND',
    $${
          "name": "execute_command",
          "strict": true,
          "parameters": {
            "type": "object",
            "required": [
              "command"
            ],
            "properties": {
              "command": {
                "type": "string",
                "description": "The shell command to execute. Use known Linux commands or commands described in the context/skills documentation."
              }
            },
            "additionalProperties": false
          },
          "description": "Function that executes a shell command to run scripts or other operations. Use standard Linux commands or commands described in the available context/skills documentation."
        }$$
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'AI_TOOL_EXAMPLES'
      AND name = 'EXECUTE_COMMAND'
);