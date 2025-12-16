package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class Usage {
    @JsonProperty("prompt_tokens")
    private Integer promptTokens;
    @JsonProperty("completion_tokens")
    private Integer completionTokens;
    @JsonProperty("total_tokens")
    private Integer totalTokens;
    @JsonProperty("prompt_tokens_details")
    private PromptTokensDetail promptTokensDetail;
    @JsonProperty("completion_tokens_details")
    private CompletionTokensDetails completionTokensDetail;


    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PromptTokensDetail {
        @JsonProperty("cached_tokens")
        private Integer cachedTokens;
        @JsonProperty("audio_tokens")
        private Integer audioTokens;
    }

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CompletionTokensDetails {
        @JsonProperty("reasoning_tokens")
        private Integer reasoningTokens;
        @JsonProperty("audio_tokens")
        private Integer audioTokens;
        @JsonProperty("accepted_prediction_tokens")
        private Integer acceptedPredictionTokens;
        @JsonProperty("rejected_prediction_tokens")
        private Integer rejectedPredictionTokens;
    }
}
