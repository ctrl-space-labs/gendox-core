package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.OpenAiCompletionRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class CohereCompletionRequest {
    private String model;
    private List<Message> messages;
    // Cohere takes OpenAI's tool definitions
    private List<OpenAiCompletionRequest.ToolDto> tools;
    // REQUIRED or NONE; left out, the model decides
    private String tool_choice;

    @Data
    @Builder(toBuilder = true)
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    public static class Message {
        private String role; // "user", "assistant" or "tool"
        private List<Content> content;
        // An assistant's tool calls (OpenAI shape) with its plan for them, and a tool result's call id
        private String tool_plan;
        private JsonNode tool_calls;
        private String tool_call_id;

        @Data
        @Builder(toBuilder = true)
        @NoArgsConstructor
        @AllArgsConstructor
        public static class Content {
            private String type; // always "text"
            private String text;
        }
    }


}
