Create a new AI tool for the Gendox agent system.

The user wants to create: $ARGUMENTS

Follow the existing tool implementation pattern:

1. **Create the tool handler** in `gendox-core-api/src/main/java/dev/ctrlspace/gendox/gendoxcoreapi/ai/engine/tools/`
   - Implement `AiToolHandler` interface
   - Provide `getName()`, `getDescription()`, `getParametersSchema()`, and `execute()` methods
   - Use `ToolExecutionContext` for accessing agent, message, and project context
   - Add `@Component` annotation so it auto-registers with `AiToolRegistry`

2. **Reference existing tools** for patterns:
   - `ReadDocumentTool.java` - backend-executable tool example
   - `AiToolHandler.java` - the interface to implement
   - `AiToolRegistry.java` - how tools are registered and discovered

3. **Create a database migration** to insert the tool definition into `ai_tools` table if it should be available by default

4. **Test** the tool by verifying it appears in the tool registry and can be executed
