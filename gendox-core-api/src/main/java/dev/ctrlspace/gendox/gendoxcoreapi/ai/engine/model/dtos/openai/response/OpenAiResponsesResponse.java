package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.OpenAiResponsesItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * {@code output} is heterogeneous: a reasoning turn that calls a tool yields a reasoning item,
 * a message item and a function_call.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class OpenAiResponsesResponse {

    private String id;
    private String object;
    private long created;
    private String model;

    /** completed | incomplete | failed | in_progress */
    private String status;

    private List<OpenAiResponsesItem> output;

    @JsonProperty("incomplete_details")
    private JsonNode incompleteDetails;

    private ResponsesUsage usage;

    /** input/output rather than prompt/completion; mapped to {@link Usage} so billing is unchanged. */
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder(toBuilder = true)
    public static class ResponsesUsage {
        @JsonProperty("input_tokens")
        private Integer inputTokens;
        @JsonProperty("output_tokens")
        private Integer outputTokens;
        @JsonProperty("total_tokens")
        private Integer totalTokens;
        @JsonProperty("input_tokens_details")
        private InputTokensDetails inputTokensDetails;
        @JsonProperty("output_tokens_details")
        private OutputTokensDetails outputTokensDetails;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder(toBuilder = true)
    public static class InputTokensDetails {
        @JsonProperty("cached_tokens")
        private Integer cachedTokens;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder(toBuilder = true)
    public static class OutputTokensDetails {
        /** A subset of output_tokens, not an addition. */
        @JsonProperty("reasoning_tokens")
        private Integer reasoningTokens;
    }
}
