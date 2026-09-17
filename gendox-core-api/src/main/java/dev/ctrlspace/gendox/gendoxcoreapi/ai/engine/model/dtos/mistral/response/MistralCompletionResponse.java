package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.response;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
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
public class MistralCompletionResponse {

    private String id;
    private String object;
    private String model;
    private Usage usage;
    private Long created;
    private List<Choice> choices;

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Usage {
        private Integer prompt_tokens;
        private Integer completion_tokens;
        private Integer total_tokens;
    }

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Choice {
        private Integer index;
        private Message message;
        private String finish_reason;

        @Data
        @Builder(toBuilder = true)
        @AllArgsConstructor
        @NoArgsConstructor
        public static class Message {
            @JsonIgnore
            private String content;

            @JsonIgnore
            private String thinking;
            private List<ToolCall> tool_calls;
            private Boolean prefix;
            private String role;

            // Plain string normally; a thinking+text chunk array once reasoning_effort is set
            @JsonProperty("content")
            public void setJsonContent(JsonNode node) {
                if (node == null || node.isNull()) {
                    return;
                }
                if (!node.isArray()) {
                    this.content = node.asText();
                    return;
                }

                List<String> texts = new ArrayList<>();
                List<String> thoughts = new ArrayList<>();
                for (JsonNode chunk : node) {
                    String type = chunk.path("type").asText("");
                    if ("thinking".equals(type)) {
                        // TODO(chris): REVIEW - docs are not explicit whether the body is under "thinking" or "text".
                        String value = chunk.hasNonNull("thinking")
                                ? chunk.get("thinking").asText()
                                : chunk.path("text").asText("");
                        if (!value.isEmpty()) {
                            thoughts.add(value);
                        }
                    } else if ("text".equals(type)) {
                        String value = chunk.path("text").asText("");
                        if (!value.isEmpty()) {
                            texts.add(value);
                        }
                    }
                }
                this.content = texts.isEmpty() ? null : String.join("\n", texts);
                this.thinking = thoughts.isEmpty() ? null : String.join("\n\n", thoughts);
            }

            @Data
            @Builder(toBuilder = true)
            @AllArgsConstructor
            @NoArgsConstructor
            public static class ToolCall {
                private String id;
                private String type;
                private ToolFunction function;
                private Integer index;

                @Data
                @Builder(toBuilder = true)
                @AllArgsConstructor
                @NoArgsConstructor
                public static class ToolFunction {
                    private String name;
                    private Map<String, Object> arguments;
                }
            }
        }
    }
}

