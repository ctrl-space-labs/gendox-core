package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)

public class CohereCompletionResponse {
    private String id;

    @JsonProperty("finish_reason")
    private String finishReason;
    private String prompt;
    private Message message;
    private Usage usage;
    private String model;
    private Double temperature;
    private Double topP;
    private Long maxToken;


    // Inner class for Message
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder(toBuilder = true)
    public static class Message {
        private String role;
        private java.util.List<Content> content;
    }

    // Inner class for Content inside Message
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder(toBuilder = true)
    public static class Content {
        private String type;
        private String text;
    }

    // Inner class for Usage
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder(toBuilder = true)
    public static class Usage {
        @JsonProperty("billed_units")
        private Tokens billedUnits;

        private Tokens tokens;
    }

    // Inner class for Tokens (used inside Usage)
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder(toBuilder = true)
    public static class Tokens {
        @JsonProperty("input_tokens")
        private Integer inputTokens;

        @JsonProperty("output_tokens")
        private Integer outputTokens;
    }
}

