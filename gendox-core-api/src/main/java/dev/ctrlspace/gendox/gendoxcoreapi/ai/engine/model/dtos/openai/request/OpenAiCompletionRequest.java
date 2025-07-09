package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class OpenAiCompletionRequest {
    private String model;
    private List<AiModelMessage> messages;
    @JsonProperty("temperature")
    private Double temperature;
    @JsonProperty("top_p")
    private Double topP;
    @JsonProperty("max_tokens")
    private Long maxTokens;
    @JsonProperty("max_completion_tokens")
    private Long maxCompletionTokens;
    @JsonProperty("tool_choice")
    private String toolChoice;
    @JsonProperty("tools")
    private List<ToolDto> tools = new ArrayList<>();
    @JsonProperty("response_format")
    private ResponseFormat responseFormat;


    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ToolDto {
        private String type;
        private JsonNode function;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResponseFormat {
        private String type;
        @JsonProperty("json_schema")
        private JsonNode jsonSchema;
    }



}

