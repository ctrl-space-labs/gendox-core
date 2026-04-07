package dev.ctrlspace.gendox.gendoxcoreapi.utils.tools;

public final class ToolDeclarationStrings {

    private ToolDeclarationStrings() {
    }

    public static final String CREATE_SUB_AGENT = """
            {
              "name": "create_sub_agent",
              "strict": true,
              "parameters": {
                "type": "object",
                "required": [
                  "task_description"
                ],
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
              },
              "description": "Create a sub-agent to perform a specific research or analysis task. The sub-agent will execute independently and return its findings."
            }
            """;
}

