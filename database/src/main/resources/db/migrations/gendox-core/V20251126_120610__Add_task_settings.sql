CREATE EXTENSION IF NOT EXISTS unaccent;


ALTER TABLE gendox_core.audit_logs
    ADD COLUMN IF NOT EXISTS cached_token_count bigint,
    ADD COLUMN IF NOT EXISTS reasoning_token_count bigint;

ALTER TABLE gendox_core.tasks
    ADD COLUMN IF NOT EXISTS completion_model_id uuid
        REFERENCES gendox_core.ai_models (id),
    ADD COLUMN IF NOT EXISTS task_prompt text,
    ADD COLUMN IF NOT EXISTS max_token bigint,
    ADD COLUMN IF NOT EXISTS temperature double precision,
    ADD COLUMN IF NOT EXISTS top_p double precision,
    ADD COLUMN IF NOT EXISTS max_questions_per_bucket integer DEFAULT 10,
    ADD COLUMN IF NOT EXISTS max_question_tokens_per_bucket integer DEFAULT 5000,
    ADD COLUMN IF NOT EXISTS max_sections_chunk_tokens integer DEFAULT 100000;

COMMENT ON COLUMN gendox_core.tasks.completion_model_id IS 'References gendox_core.ai_models(id) used for completion model';
COMMENT ON COLUMN gendox_core.tasks.task_prompt IS 'Prompt used for generating task completions';
COMMENT ON COLUMN gendox_core.tasks.max_token IS 'Maximum tokens allowed for completion';
COMMENT ON COLUMN gendox_core.tasks.temperature IS 'Sampling temperature for the completion model';
COMMENT ON COLUMN gendox_core.tasks.top_p IS 'Top-p (nucleus) sampling parameter for the completion model';

COMMENT ON COLUMN gendox_core.tasks.max_questions_per_bucket IS 'Max number of questions per bucket (default 10)';
COMMENT ON COLUMN gendox_core.tasks.max_question_tokens_per_bucket IS 'Max cumulative question tokens per bucket (default 5000)';
COMMENT ON COLUMN gendox_core.tasks.max_sections_chunk_tokens IS 'Max tokens allowed for sections chunking (default 100000)';

CREATE INDEX IF NOT EXISTS idx_tasks_completion_model
    ON gendox_core.tasks (completion_model_id);

ALTER TABLE gendox_core.document_instance
    ADD COLUMN IF NOT EXISTS total_tokens bigint;



INSERT INTO gendox_core.types (type_category, name, description)
SELECT
    'AI_TOOL_EXAMPLES',
    'READ_DOCUMENT',
    $${
      "name": "read_document",
      "strict": true,
      "parameters": {
        "type": "object",
        "required": [
          "document_id"
        ],
        "properties": {
          "document_id": {
            "type": "string",
            "description": "the UUID of the document to load"
          }
        },
        "additionalProperties": false
      },
      "description": "Function that is used to fetch the content of the document in the LLM contexts"
    }$$
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'AI_TOOL_EXAMPLES'
      AND name = 'READ_DOCUMENT'
);