package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.anthropic.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
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
        private String id;
        private String name;
        private JsonNode input;
    }

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Usage {
        // Core token counts from Anthropic API
        private Integer input_tokens; // User input tokens
        private Integer output_tokens; // Model output tokens (currently includes thinking tokens)

        // Cache metrics (prompt caching); see https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
        @JsonProperty("cache_creation_input_tokens")
        private Integer cache_creation_input_tokens;
        @JsonProperty("cache_read_input_tokens")
        private Integer cache_read_input_tokens;
        @JsonProperty("cache_creation")
        private CacheCreation cache_creation;

        @JsonProperty("service_tier")
        private String service_tier;
        @JsonProperty("inference_geo")
        private String inference_geo;

        // NOTE: Thinking tokens are NOT separately reported by Anthropic API yet.
        // When using extended thinking, thinking tokens are included in output_tokens.

        @Data
        @Builder(toBuilder = true)
        @AllArgsConstructor
        @NoArgsConstructor
        public static class CacheCreation {
            @JsonProperty("ephemeral_5m_input_tokens")
            private Integer ephemeral5mInputTokens;
            @JsonProperty("ephemeral_1h_input_tokens")
            private Integer ephemeral1hInputTokens;
        }
    }
}
