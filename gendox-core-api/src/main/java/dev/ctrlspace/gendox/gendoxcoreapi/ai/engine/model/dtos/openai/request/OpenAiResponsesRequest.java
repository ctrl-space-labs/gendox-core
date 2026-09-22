package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.OpenAiResponsesItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Body for {@code POST /v1/responses}. Differs from {@link OpenAiCompletionRequest}:
 * {@code input} replaces {@code messages} and is heterogeneous, the system prompt moves to
 * {@code instructions}, tools are flat, and {@code max_output_tokens} replaces {@code max_tokens}.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class OpenAiResponsesRequest {

    private String model;
    private List<OpenAiResponsesItem> input;

    // The system prompt; Responses carries it here rather than as a message.
    private String instructions;

    @JsonProperty("max_output_tokens")
    private Long maxOutputTokens;

    private Reasoning reasoning;

    private List<ToolDto> tools;

    @JsonProperty("tool_choice")
    private String toolChoice;

    private Double temperature;

    @JsonProperty("top_p")
    private Double topP;

    // False: history lives in our message table, so reasoning replays via encrypted_content
    private Boolean store;

    // {@code ["reasoning.encrypted_content"]}, for stateless reasoning replay.
    private List<String> include;

    private TextConfig text;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    public static class Reasoning {
        // none | minimal | low | medium | high
        private String effort;
        // "auto" picks the most detailed summariser available.
        private String summary;
    }

    /** Flat; Chat Completions nests these under "function". */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    public static class ToolDto {
        private String type;
        private String name;
        private String description;
        private JsonNode parameters;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    public static class TextConfig {
        private Format format;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    public static class Format {
        private String type;
        private String name;
        private JsonNode schema;

        /**
         * Responses defaults this to true, unlike Chat Completions, and strict mode demands
         * {@code additionalProperties: false} plus an exhaustive {@code required} on every
         * nested object. Schemas reach us from a generator and from user-defined structures,
         * so we send it explicitly rather than inheriting the stricter default.
         */
        private Boolean strict;
    }
}
