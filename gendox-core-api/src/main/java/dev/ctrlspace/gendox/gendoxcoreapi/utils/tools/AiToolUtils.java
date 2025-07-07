package dev.ctrlspace.gendox.gendoxcoreapi.utils.tools;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.tools.ToolFunctionCall;
import org.springframework.stereotype.Component;

@Component
public class AiToolUtils {


    private ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Deserialize a tool‐call JSON node into a ToolFunctionCall<T> with typed arguments.
     *
     * @param toolFunctionCallJson  the JSON tree for one tool‐call, e.g.
     *                              { "name": "advanced_search", "arguments": { … } }
     *                              or
     *                              { "name": "advanced_search", "arguments":
     *                                  "{\"search_query\":\"…\"}" }
     * @param argumentsType        the Class of the T you want for the "arguments" field
     * @param <T>                  the type of the arguments DTO
     * @return                     a ToolFunctionCall<T> with `arguments` bound to T
     * @throws JsonProcessingException on JSON parsing errors
     */
    public <T> ToolFunctionCall<T> deserializeToolFunctionCall(
            ObjectNode toolFunctionCallJson,
            Class<T> argumentsType
    ) throws JsonProcessingException {

        // 1) Unwrap string‐encoded JSON if necessary
        JsonNode rawArgs = toolFunctionCallJson.get("arguments");
        if (rawArgs != null && rawArgs.isTextual()) {
            // parse the inner JSON string
            String inner = rawArgs.asText();
            JsonNode unwrapped = objectMapper.readTree(inner);
            toolFunctionCallJson.set("arguments", unwrapped);
        }

        // Build the JavaType: ToolFunctionCall<argumentsType>
        JavaType callType = objectMapper.getTypeFactory()
                .constructParametricType(ToolFunctionCall.class, argumentsType);


        return objectMapper.treeToValue(toolFunctionCallJson, callType);

    }


}
