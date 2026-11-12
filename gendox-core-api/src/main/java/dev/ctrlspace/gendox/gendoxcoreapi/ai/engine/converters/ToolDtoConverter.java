package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.OpenAiCompletionRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxRuntimeException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

@Component
public class ToolDtoConverter {

    private ObjectMapper objectMapper;

    public ToolDtoConverter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public OpenAiCompletionRequest.ToolDto toToolDto(AiTools entity) {
        JsonNode fnObj = null; // json_schema is the whole function block
        try {
            fnObj = objectMapper.readTree(entity.getJsonSchema());
        } catch (JacksonException e) {
            throw new GendoxRuntimeException(HttpStatus.BAD_REQUEST, "AI_TOOL_NOT_PROPER_JSON_SCHEMA", "Tool json schema is not a valid JSON", e);
        }
        return OpenAiCompletionRequest.ToolDto.builder()
                .type(entity.getType())   // "function"
                .function(fnObj)
                .build();
    }
}
