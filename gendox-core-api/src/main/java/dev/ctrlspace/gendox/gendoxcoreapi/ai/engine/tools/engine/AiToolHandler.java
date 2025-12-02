package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine;

import com.fasterxml.jackson.databind.JsonNode;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;

public interface AiToolHandler {
    /**
     * The tool name as exposed in the LLM's tool / function definition.
     */
    String getName();

    /**
     * Execute the tool with the given arguments and context.
     */
    JsonNode execute(JsonNode arguments, ToolExecutionContext context) throws GendoxException;

    public JsonNode getParametersSchema();

    public String getDescription();
}
