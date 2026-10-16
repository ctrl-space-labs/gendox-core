package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
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
    private List<dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.OpenAiCompletionRequest.ToolDto> tools;
    private String tool_choice;

    @Data
    @Builder(toBuilder = true)
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Message {
        private String role;
        @JsonInclude(JsonInclude.Include.NON_NULL)
        private com.fasterxml.jackson.databind.JsonNode tool_calls;
        @JsonInclude(JsonInclude.Include.NON_NULL)
        private String tool_call_id;
        @JsonInclude(JsonInclude.Include.NON_NULL)
        private String tool_plan;
        private List<Content> content;

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
