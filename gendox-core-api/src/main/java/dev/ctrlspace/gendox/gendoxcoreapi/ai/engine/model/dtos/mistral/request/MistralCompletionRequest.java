package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.request;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MistralCompletionRequest {

    private String model;
    private Double temperature;
    private Double top_p;
    private Integer max_tokens;
    private Boolean stream;
    private String stop;
    private Integer random_seed;
    private List<MistralMessage> messages;
    private ResponseFormat response_format;
    private List<Tool> tools;
    private String tool_choice;
    private Double presence_penalty;
    private Double frequency_penalty;
    private Integer n;
    private Prediction prediction;
    private Boolean parallel_tool_calls;
    private Boolean safe_prompt;
    // none | low | medium | high. Supported on magistral-* and mistral-small/medium
    private String reasoning_effort;

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ResponseFormat {
        private String type;
        private JsonSchema json_schema;

        @Data
        @Builder(toBuilder = true)
        @AllArgsConstructor
        @NoArgsConstructor
        public static class JsonSchema {
            private String name;
            private String description;
            private Map<String, Object> schema;
            private Boolean strict;
        }
    }

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Tool {
        private String type;
        private ToolFunction function;

        @Data
        @Builder(toBuilder = true)
        @AllArgsConstructor
        @NoArgsConstructor
        public static class ToolFunction {
            private String name;
            private String description;
            private Boolean strict;
            private Map<String, Object> parameters;
        }
    }

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Prediction {
        private String type;
        private String content;
    }

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MistralMessage {
        private String role;

        @JsonIgnore
        private String content;

        // Reasoning trace
        @JsonIgnore
        private String thinking;

        /** Plain string normally; a thinking+text chunk array when replaying reasoning. */
        @JsonProperty("content")
        public Object getJsonContent() {
            if (thinking == null || thinking.isBlank()) {
                return content;
            }
            List<Map<String, String>> chunks = new ArrayList<>();
            chunks.add(Map.of("type", "thinking", "thinking", thinking));
            if (content != null && !content.isBlank()) {
                chunks.add(Map.of("type", "text", "text", content));
            }
            return chunks;
        }
    }
}

