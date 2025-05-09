package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
        private String content;
    }
}

