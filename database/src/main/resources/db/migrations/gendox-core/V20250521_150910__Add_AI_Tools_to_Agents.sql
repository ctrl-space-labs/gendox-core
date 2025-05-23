CREATE TABLE IF NOT EXISTS gendox_core.ai_tools
(
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id    UUID  NOT NULL,
    type        TEXT  NOT NULL,
    json_schema JSONB NOT NULL,
    FOREIGN KEY (agent_id) REFERENCES gendox_core.project_agent (id)
        ON DELETE CASCADE
);



-- 1) open_web_page tool
INSERT INTO gendox_core.types (type_category, name, description)
SELECT
    'AI_TOOL_EXAMPLES',
    'OPEN_WEB_PAGE',
    $${
    "name": "open_web_page",
    "description": "Function to open a web page in the browser. Sends an event to the browser to open a new tab with the specified URL.",
    "strict": true,
    "parameters": {
      "type": "object",
      "required": [
        "url"
      ],
      "properties": {
        "url": {
          "type": "string",
          "description": "The URL of the web page to open"
        }
      },
      "additionalProperties": false
    }
  }$$
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'AI_TOOL_EXAMPLES'
      AND name = 'OPEN_WEB_PAGE'
);


-- 2) fill_fields tool
INSERT INTO gendox_core.types (type_category, name, description)
SELECT
    'AI_TOOL_EXAMPLES',
    'FILL_FIELDS',
    $${
    "name": "fill_fields",
    "description": "Generic function to fill a form or apply filters or in general apply key–value combinations on the current webpage. Use this to:\n  • Fill out a form (e.g. 'firstName':'Jane', 'lastName':'Doe', 'email':'jane.doe@example.com').\n  • Apply filters (e.g. 'color':'red', 'color':'blue', 'size':'M', 'brand':'Acme').",
    "strict": true,
    "parameters": {
      "type": "object",
      "required": [
        "entries"
      ],
      "properties": {
        "entries": {
          "type": "array",
          "description": "List of key–value pairs representing fields to fill or options to apply.",
          "items": {
            "type": "object",
            "properties": {
              "key": {
                "type": "string",
                "description": "The name or identifier of the field or option (e.g. 'email', 'firstName', 'color', 'size')."
              },
              "value": {
                "type": "string",
                "description": "The value to enter or apply for the specified key."
              }
            },
            "required": [
              "key",
              "value"
            ],
            "additionalProperties": false
          }
        }
      },
      "additionalProperties": false
    }
  }$$
WHERE NOT EXISTS (
    SELECT 1
    FROM gendox_core.types
    WHERE type_category = 'AI_TOOL_EXAMPLES'
      AND name = 'FILL_FIELDS'
);