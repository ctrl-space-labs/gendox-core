package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class CohereEmbedResponse {
    private String id;
    private Embeddings embeddings;
    private List<String> texts;
    private Meta meta;

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Embeddings {
        @JsonProperty("float")
        private List<List<Float>> _float;
    }

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Meta {
        private ApiVersion api_version;
        private BilledUnits billed_units;
        private List<String> warnings;
    }

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ApiVersion {
        private String version;
        private boolean is_experimental;
    }

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class BilledUnits {
        private int input_tokens;
    }
}

