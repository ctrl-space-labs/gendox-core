package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import org.springframework.http.HttpStatus;

/**
 * A tool whose whole definition (name, description, parameters) is one hardcoded JSON string, the
 * same JSON the model receives. Name, description and schema are read from it, so they can't drift
 * apart.
 */
public abstract class DefinedToolHandler implements AiToolHandler {

    private final JsonNode definition;

    protected DefinedToolHandler(ObjectMapper objectMapper, String definitionJson) {
        try {
            this.definition = objectMapper.readTree(definitionJson);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Invalid tool definition in " + getClass().getSimpleName(), e);
        }
    }

    /** Reads tool arguments (an object, or the JSON text of one; empty means none) into a typed record. */
    public static <A> A readArguments(ObjectMapper objectMapper, JsonNode arguments, Class<A> type) throws GendoxException {
        try {
            JsonNode node = arguments == null || arguments.isNull() ? objectMapper.createObjectNode()
                    : arguments.isTextual() ? objectMapper.readTree(arguments.asText().isBlank() ? "{}" : arguments.asText())
                    : arguments;
            return objectMapper.treeToValue(node, type);
        } catch (JsonProcessingException e) {
            throw new GendoxException("INVALID_TOOL_ARGUMENTS", "Arguments are not valid: " + e.getOriginalMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @Override
    public String getName() {
        return definition.get("name").asText();
    }

    @Override
    public String getDescription() {
        return definition.get("description").asText();
    }

    @Override
    public JsonNode getParametersSchema() {
        return definition.get("parameters");
    }
}
