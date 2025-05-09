package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.anthropic.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class AnthropicCompletionResponse {

    private String id;
    private String model;
    private String role;
    private String stop_reason;
    private String stop_sequence;
    private String type;
    private List<Content> content;
    private Usage usage;

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Content {
        private String text;
        private String type;
    }

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Usage {
        private Integer input_tokens;
        private Integer output_tokens;
    }
}

