package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)

public class CohereCompletionResponse {
    private String id;
    private String finish_reason;
    private Message message;
    private Usage usage;

    @Data
    @Builder(toBuilder = true)
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Message {
        private String role; // "assistant"
        private List<Content> content;

        @Data
        @Builder(toBuilder = true)
        @NoArgsConstructor
        @AllArgsConstructor
        public static class Content {
            private String type; // "text"
            private String text;
        }
    }

    @Data
    @Builder(toBuilder = true)
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Usage {
        private BilledUnits billed_units;
        private Tokens tokens;

        @Data
        @Builder(toBuilder = true)
        @NoArgsConstructor
        @AllArgsConstructor
        public static class BilledUnits {
            private Integer input_tokens;
            private Integer output_tokens;
        }

        @Data
        @Builder(toBuilder = true)
        @NoArgsConstructor
        @AllArgsConstructor
        public static class Tokens {
            private Integer input_tokens;
            private Integer output_tokens;
        }
    }
}

