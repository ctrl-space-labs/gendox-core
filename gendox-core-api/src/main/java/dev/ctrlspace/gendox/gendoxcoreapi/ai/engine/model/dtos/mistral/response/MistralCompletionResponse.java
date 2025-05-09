package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.response;

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
            private String content;
            private List<ToolCall> tool_calls;
            private Boolean prefix;
            private String role;

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

