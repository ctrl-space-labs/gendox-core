-- #517 Agent Skills.
--
-- 1. gendox_core.skills: the catalog of system (Gendox) skills. Every version is its own row;
--    a new version is a new row with version + 1, and the previous row stops being the latest.
-- 2. gendox_core.agent_skills: what an agent actually receives. Either a copy of a system skill
--    (skill_id set, read-only) or a SKILL.md the user wrote (skill_id null).
--
-- The tools a skill brings (its allowed-tools) are read from its SKILL.md and added to chat
-- completions while the skill is linked to the agent; they are not stored anywhere.


-- 1) System skills catalog
CREATE TABLE IF NOT EXISTS gendox_core.skills
(
    id          UUID    NOT NULL DEFAULT uuid_generate_v4(),
    name        TEXT    NOT NULL,
    description TEXT    NOT NULL,
    content     TEXT    NOT NULL,
    version     INTEGER NOT NULL,
    latest      BOOLEAN NOT NULL DEFAULT TRUE,
    deleted     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP,
    created_by  UUID,
    updated_by  UUID,
    PRIMARY KEY (id),
    CONSTRAINT uq_skills_name_version UNIQUE (name, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_skills_name_latest
    ON gendox_core.skills (name)
    WHERE latest;


-- 2) The skills of each agent
CREATE TABLE IF NOT EXISTS gendox_core.agent_skills
(
    id          UUID NOT NULL DEFAULT uuid_generate_v4(),
    agent_id    UUID NOT NULL,
    skill_id    UUID,
    name        TEXT NOT NULL,
    description TEXT NOT NULL,
    content     TEXT NOT NULL,
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP,
    created_by  UUID,
    updated_by  UUID,
    PRIMARY KEY (id),
    CONSTRAINT uq_agent_skills_agent_name UNIQUE (agent_id, name),
    CONSTRAINT fk_agent_skills_agent
        FOREIGN KEY (agent_id) REFERENCES gendox_core.project_agent (id) ON DELETE CASCADE,
    CONSTRAINT fk_agent_skills_skill
        FOREIGN KEY (skill_id) REFERENCES gendox_core.skills (id)
);

CREATE INDEX IF NOT EXISTS ix_agent_skills_skill_id
    ON gendox_core.agent_skills (skill_id);


-- The in-app assistant's task tools. The gendox-assistant skill brings them to an agent
-- (allowed-tools); they are also offered as examples in the agent's Tools section.

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AI_TOOL_EXAMPLES', 'ADD_TASK_DOCUMENTS', $${
      "name": "add_task_documents",
      "description": "Add documents of the current project to a task. Documents already in the task are skipped.",
      "parameters": {
        "type": "object",
        "required": [
          "task_id",
          "documents"
        ],
        "properties": {
          "task_id": {
            "type": "string",
            "description": "The UUID of the task."
          },
          "documents": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "object",
              "required": [
                "document_id"
              ],
              "properties": {
                "document_id": {
                  "type": "string",
                  "description": "The UUID of the document."
                },
                "page_from": {
                  "type": "integer",
                  "description": "Optional. Process from this page (1-based)."
                },
                "page_to": {
                  "type": "integer",
                  "description": "Optional. Process up to this page (inclusive)."
                },
                "prompt": {
                  "type": "string",
                  "description": "Optional. Instructions specific to this document."
                }
              },
              "additionalProperties": false
            }
          }
        },
        "additionalProperties": false
      }
    }$$
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'AI_TOOL_EXAMPLES' AND name = 'ADD_TASK_DOCUMENTS'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AI_TOOL_EXAMPLES', 'ADD_TASK_QUESTIONS', $${
      "name": "add_task_questions",
      "description": "Add questions to a Document Insights task. Each question becomes a column answered for every document.",
      "parameters": {
        "type": "object",
        "required": [
          "task_id",
          "questions"
        ],
        "properties": {
          "task_id": {
            "type": "string",
            "description": "The UUID of the task."
          },
          "questions": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "object",
              "required": [
                "text"
              ],
              "properties": {
                "text": {
                  "type": "string",
                  "description": "The question asked of each document."
                },
                "title": {
                  "type": "string",
                  "description": "Optional. A short column title."
                }
              },
              "additionalProperties": false
            }
          }
        },
        "additionalProperties": false
      }
    }$$
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'AI_TOOL_EXAMPLES' AND name = 'ADD_TASK_QUESTIONS'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AI_TOOL_EXAMPLES', 'CREATE_TASK', $${
      "name": "create_task",
      "description": "Create a new, empty task in the current project. Add documents (and, for Document Insights, questions) afterwards.",
      "parameters": {
        "type": "object",
        "required": [
          "title",
          "type"
        ],
        "properties": {
          "title": {
            "type": "string",
            "description": "The task title."
          },
          "type": {
            "type": "string",
            "enum": [
              "DOCUMENT_INSIGHTS",
              "DOCUMENT_DIGITIZATION"
            ],
            "description": "DOCUMENT_INSIGHTS answers questions on each document. DOCUMENT_DIGITIZATION turns each page of each document into text."
          },
          "description": {
            "type": "string",
            "description": "Optional. What the task is for."
          },
          "task_prompt": {
            "type": "string",
            "description": "Optional. Instructions applied to every document of the task."
          }
        },
        "additionalProperties": false
      }
    }$$
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'AI_TOOL_EXAMPLES' AND name = 'CREATE_TASK'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AI_TOOL_EXAMPLES', 'GET_TASK_RUN_STATUS', $${
      "name": "get_task_run_status",
      "description": "Get the most recent runs of a task, newest first, with their status (STARTING, STARTED, COMPLETED, FAILED, STOPPED, ...) and start and end times.",
      "parameters": {
        "type": "object",
        "required": [
          "task_id"
        ],
        "properties": {
          "task_id": {
            "type": "string",
            "description": "The UUID of the task."
          }
        },
        "additionalProperties": false
      }
    }$$
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'AI_TOOL_EXAMPLES' AND name = 'GET_TASK_RUN_STATUS'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AI_TOOL_EXAMPLES', 'GET_TASK', $${
      "name": "get_task",
      "description": "Get a task of the current project: its type, title, description, prompt, and how many documents, questions and answers it has.",
      "parameters": {
        "type": "object",
        "required": [
          "task_id"
        ],
        "properties": {
          "task_id": {
            "type": "string",
            "description": "The UUID of the task."
          }
        },
        "additionalProperties": false
      }
    }$$
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'AI_TOOL_EXAMPLES' AND name = 'GET_TASK'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AI_TOOL_EXAMPLES', 'LIST_TASK_ANSWERS', $${
      "name": "list_task_answers",
      "description": "List the results of a task with a short preview of each. Document Insights: one answer per document and question. Document Digitization: one result per page of each document. Each item has total_chars; read the full text with read_task_result. Paged.",
      "parameters": {
        "type": "object",
        "required": [
          "task_id"
        ],
        "properties": {
          "task_id": {
            "type": "string",
            "description": "The UUID of the task."
          },
          "document_id": {
            "type": "string",
            "description": "Optional. Only the results of this document (the document's UUID)."
          },
          "question_id": {
            "type": "string",
            "description": "Optional. Document Insights only: only the answers to this question."
          },
          "page_from": {
            "type": "integer",
            "description": "Optional. Document Digitization only: first page number (1-based)."
          },
          "page_to": {
            "type": "integer",
            "description": "Optional. Document Digitization only: last page number (inclusive)."
          },
          "page": {
            "type": "integer",
            "description": "Optional. 0-based page number of the result list. Default 0."
          },
          "size": {
            "type": "integer",
            "description": "Optional. Page size, 1-50. Default 20."
          }
        },
        "additionalProperties": false
      }
    }$$
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'AI_TOOL_EXAMPLES' AND name = 'LIST_TASK_ANSWERS'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AI_TOOL_EXAMPLES', 'LIST_TASK_ITEMS', $${
      "name": "list_task_items",
      "description": "List the documents of a task (with their page range and document-specific prompt), or the questions of a Document Insights task in column order. Paged.",
      "parameters": {
        "type": "object",
        "required": [
          "task_id",
          "kind"
        ],
        "properties": {
          "task_id": {
            "type": "string",
            "description": "The UUID of the task."
          },
          "kind": {
            "type": "string",
            "enum": [
              "documents",
              "questions"
            ],
            "description": "Which items to list."
          },
          "page": {
            "type": "integer",
            "description": "Optional. 0-based page number. Default 0."
          },
          "size": {
            "type": "integer",
            "description": "Optional. Page size, 1-50. Default 20."
          }
        },
        "additionalProperties": false
      }
    }$$
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'AI_TOOL_EXAMPLES' AND name = 'LIST_TASK_ITEMS'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AI_TOOL_EXAMPLES', 'LIST_TASKS', $${
      "name": "list_tasks",
      "description": "List the tasks of the current project (Document Insights, Document Digitization, ...), newest first. Paged: the result has items, page, size, total and has_more.",
      "parameters": {
        "type": "object",
        "properties": {
          "name_contains": {
            "type": "string",
            "description": "Optional. Only tasks whose title contains this text (case-insensitive)."
          },
          "page": {
            "type": "integer",
            "description": "Optional. 0-based page number. Default 0."
          },
          "size": {
            "type": "integer",
            "description": "Optional. Page size, 1-50. Default 20."
          }
        },
        "additionalProperties": false
      }
    }$$
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'AI_TOOL_EXAMPLES' AND name = 'LIST_TASKS'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AI_TOOL_EXAMPLES', 'READ_TASK_RESULT', $${
      "name": "read_task_result",
      "description": "Read the full text of one task result, a slice at a time. Give question_id for a Document Insights answer, page_number for a Document Digitization page, or summary=true for a document's Insights summary. The result has text, offset, total_chars and next_offset; call again with offset=next_offset until next_offset is null.",
      "parameters": {
        "type": "object",
        "required": [
          "task_id",
          "document_id"
        ],
        "properties": {
          "task_id": {
            "type": "string",
            "description": "The UUID of the task."
          },
          "document_id": {
            "type": "string",
            "description": "The UUID of the document."
          },
          "question_id": {
            "type": "string",
            "description": "Document Insights: the question whose answer to read."
          },
          "page_number": {
            "type": "integer",
            "description": "Document Digitization: the page to read (1-based)."
          },
          "summary": {
            "type": "boolean",
            "description": "Document Insights: true to read the document's summary."
          },
          "offset": {
            "type": "integer",
            "description": "Optional. Character offset to start from. Default 0."
          },
          "max_chars": {
            "type": "integer",
            "description": "Optional. Characters to return, 500-12000. Default 6000."
          }
        },
        "additionalProperties": false
      }
    }$$
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'AI_TOOL_EXAMPLES' AND name = 'READ_TASK_RESULT'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AI_TOOL_EXAMPLES', 'RUN_TASK', $${
      "name": "run_task",
      "description": "Start a task run that generates only the missing results; existing results are kept. It cannot regenerate existing results. It uses credits, so confirm with the user first. Check progress with get_task_run_status.",
      "parameters": {
        "type": "object",
        "required": [
          "task_id"
        ],
        "properties": {
          "task_id": {
            "type": "string",
            "description": "The UUID of the task."
          },
          "document_ids": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Optional. Only these documents. Default: every document of the task."
          },
          "question_ids": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Optional. Document Insights only: only these questions. Default: every question."
          }
        },
        "additionalProperties": false
      }
    }$$
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'AI_TOOL_EXAMPLES' AND name = 'RUN_TASK'
);

INSERT INTO gendox_core.types (type_category, name, description)
SELECT 'AI_TOOL_EXAMPLES', 'UPDATE_TASK_ITEM', $${
      "name": "update_task_item",
      "description": "Change one question of a Document Insights task (text, title) or one document of a task (document-specific prompt, page range). Give question_id or document_id. Changing a question's text deletes its answers; in Document Insights, changing a document's prompt deletes that document's answers. Confirm with the user first.",
      "parameters": {
        "type": "object",
        "required": [
          "task_id"
        ],
        "properties": {
          "task_id": {
            "type": "string",
            "description": "The UUID of the task."
          },
          "question_id": {
            "type": "string",
            "description": "The question to change."
          },
          "text": {
            "type": "string",
            "description": "Question only. The new question text."
          },
          "title": {
            "type": "string",
            "description": "Question only. The new column title."
          },
          "document_id": {
            "type": "string",
            "description": "The document to change (the document's UUID)."
          },
          "prompt": {
            "type": "string",
            "description": "Document only. New instructions specific to this document."
          },
          "page_from": {
            "type": "integer",
            "description": "Document only. Process from this page (1-based)."
          },
          "page_to": {
            "type": "integer",
            "description": "Document only. Process up to this page (inclusive)."
          },
          "all_pages": {
            "type": "boolean",
            "description": "Document only. true to process every page, clearing the page range."
          }
        },
        "additionalProperties": false
      }
    }$$
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'AI_TOOL_EXAMPLES' AND name = 'UPDATE_TASK_ITEM'
);
