-- AI_TOOL_EXAMPLES: seed tool JSON aligned with gendox-core-api .../ai/engine/tools/*Tool.java

-- create_note (widget / host-handled; no Java handler required)
INSERT INTO gendox_core.types (type_category, name, description)
SELECT
    'AI_TOOL_EXAMPLES',
    'CREATE_NOTE',
    $${
    "name": "create_note",
    "description": "Create a structured note for an important finding or excerpt. Use when the exact wording must be preserved (e.g. a clause, amount, date, or obligation). The host app may persist or display the note; the model should pass the text in content.",
    "parameters": {
      "type": "object",
      "required": ["content"],
      "properties": {
        "content": {
          "type": "string",
          "description": "The exact text or observation to note."
        },
        "note_type": {
          "type": "string",
          "description": "Category: e.g. finding, risk, summary, clause, question. 'note' by default"
        },
        "document_reference": {
          "type": "string",
          "description": "Optional source document UUID."
        }
      },
      "additionalProperties": false
    }
  }$$
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'AI_TOOL_EXAMPLES' AND name = 'CREATE_NOTE'
);

-- RegexSearchTool
INSERT INTO gendox_core.types (type_category, name, description)
SELECT
    'AI_TOOL_EXAMPLES',
    'REGEX_SEARCH',
    $${
    "name": "regex_search",
    "description": "Search one or more documents for lines that match any of the provided regular expressions. Returns each matching line with its line number, the matching pattern, and the document it came from. Useful for locating specific dates, numbers, string literals, or any structured text.",
    "parameters": {
      "type": "object",
      "required": ["patterns", "document_ids"],
      "properties": {
        "patterns": {
          "type": "array",
          "description": "List of Java regular expression patterns to search for.",
          "items": { "type": "string" },
          "minItems": 1
        },
        "document_ids": {
          "type": "array",
          "description": "List of document UUIDs to search in.",
          "items": { "type": "string", "format": "uuid" },
          "minItems": 1
        },
        "case_insensitive": {
          "type": "boolean",
          "description": "When true, pattern matching ignores letter case. Defaults to true.",
          "default": true
        }
      },
      "additionalProperties": false
    }
  }$$
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'AI_TOOL_EXAMPLES' AND name = 'REGEX_SEARCH'
);

-- SummarizerSubAgentTool
INSERT INTO gendox_core.types (type_category, name, description)
SELECT
    'AI_TOOL_EXAMPLES',
    'SUMMARIZE',
    $${
    "name": "summarize",
    "description": "It created a sub-agent to summarize documents or extract focused information from them. The sub-agent receives the full conversation history as context and performs the summarization task described in the task_description. Use this when you need a condensed, targeted summary of a document or a set of findings.",
    "parameters": {
      "type": "object",
      "required": ["task_description"],
      "properties": {
        "task_description": {
          "type": "string",
          "description": "A clear description of what to summarize and what information to extract. Example: Summarize all payment-related clauses from the above discussion or Read document with id=... and summarize it for [...] ."
        },
        "system_instructions": {
          "type": "string",
          "description": "Optional role or behavioral instructions for the summarizer sub-agent."
        }
      },
      "additionalProperties": false
    }
  }$$
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'AI_TOOL_EXAMPLES' AND name = 'SUMMARIZE'
);

-- DocumentSectionExtractorTool
INSERT INTO gendox_core.types (type_category, name, description)
SELECT
    'AI_TOOL_EXAMPLES',
    'EXTRACT_RELEVANT_SECTIONS',
    $${
    "name": "extract_relevant_sections",
    "description": "Scan a large reference document and return the line ranges that are relevant to a given task description. Provide the UUID of the large document and a summary of what is important to be extracted (or the specific topic to look for). Returns a JSON array of {line_start, line_end} objects that can be passed to read_document as line_ranges.",
    "strict": true,
    "parameters": {
      "type": "object",
      "required": ["document_id", "task_description"],
      "properties": {
        "document_id": {
          "type": "string",
          "format": "uuid",
          "description": "UUID of the reference document to scan."
        },
        "task_description": {
          "type": "string",
          "description": "Topic description used to identify relevant sections in the large document."
        }
      },
      "additionalProperties": false
    }
  }$$
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'AI_TOOL_EXAMPLES' AND name = 'EXTRACT_RELEVANT_SECTIONS'
);

-- DocumentDiffTool
INSERT INTO gendox_core.types (type_category, name, description)
SELECT
    'AI_TOOL_EXAMPLES',
    'DIFF_DOCUMENTS',
    $${
    "name": "diff_documents",
    "description": "Compare two documents and return their differences, similar to git diff a b. Provide the UUID of the original document (a) and the UUID of the modified document (b). DELETE hunks are lines present only in (a); INSERT hunks are lines present only in (b); EQUAL hunks show unchanged context around each change.",
    "strict": true,
    "parameters": {
      "type": "object",
      "required": ["document_a_id", "document_b_id"],
      "properties": {
        "document_a_id": {
          "type": "string",
          "format": "uuid",
          "description": "UUID of the original (baseline) document — analogous to the left side of a diff."
        },
        "document_b_id": {
          "type": "string",
          "format": "uuid",
          "description": "UUID of the modified document — analogous to the right side of a diff."
        }
      },
      "additionalProperties": false
    }
  }$$
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'AI_TOOL_EXAMPLES' AND name = 'DIFF_DOCUMENTS'
);

-- ReadDocumentTool: UPDATE aligns with ReadDocumentTool (line_ranges, uuid).
UPDATE gendox_core.types
SET description = $${
    "name": "read_document",
    "description": "Read the full text of a document by its ID. Optionally provide line_ranges (array of {line_start, line_end}) to return only specific portions. Ranges are expanded to bring in surrounding context.",
    "parameters": {
      "type": "object",
      "required": ["document_id"],
      "properties": {
        "document_id": {
          "type": "string",
          "format": "uuid",
          "description": "The UUID of the document to read."
        },
        "line_ranges": {
          "type": "array",
          "description": "Optional. When provided, only lines within these ranges are returned. Ranges are expanded to bring in surrounding context.",
          "items": {
            "type": "object",
            "required": ["line_start", "line_end"],
            "properties": {
              "line_start": { "type": "integer", "description": "First line number (inclusive)." },
              "line_end":   { "type": "integer", "description": "Last line number (inclusive)." }
            }
          }
        }
      }
    }
  }$$
WHERE type_category = 'AI_TOOL_EXAMPLES'
  AND name = 'READ_DOCUMENT';

-- CreateSubAgentTool
INSERT INTO gendox_core.types (type_category, name, description)
SELECT
    'AI_TOOL_EXAMPLES',
    'CREATE_SUB_AGENT',
    $${
    "name": "create_sub_agent",
    "description": "Create a sub-agent to perform a specific research or analysis task. The sub-agent will execute independently and return its findings.",
    "parameters": {
      "type": "object",
      "required": ["task_description"],
      "properties": {
        "task_description": {
          "type": "string",
          "description": "A clear description of the task the sub-agent should perform."
        },
        "system_instructions": {
          "type": "string",
          "description": "Optional system-level instructions for the sub-agent's behavior and role."
        }
      },
      "additionalProperties": false
    }
  }$$
WHERE NOT EXISTS (
    SELECT 1 FROM gendox_core.types WHERE type_category = 'AI_TOOL_EXAMPLES' AND name = 'CREATE_SUB_AGENT'
);

