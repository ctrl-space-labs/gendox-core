package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.anthropic.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class AnthropicCompletionRequest {

    private String model;
    private Integer max_tokens;
    /** Top-level automatic prompt caching (default 5-minute ephemeral TTL per Anthropic). */
    @JsonProperty("cache_control")
    private CacheControl cacheControl;
    private String system;
    private List<Message> messages;
    @JsonProperty("output_config")
    private OutputConfig outputConfig;
    private List<ToolDefinition> tools = new ArrayList<>();
    @JsonProperty("tool_choice")
    private JsonNode toolChoice;
    private Double temperature;
    @JsonProperty("top_p")
    private Double topP;

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CacheControl {
        private String type;
    }

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OutputConfig {
        private Format format;
    }

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Format {
        private String type;
        private JsonNode schema;
    }

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Message {
        private String role;
        private JsonNode content;
    }

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ToolDefinition {
        private String name;
        private String description;
        @JsonProperty("input_schema")
        private JsonNode inputSchema;
    }
}
