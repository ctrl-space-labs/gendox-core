package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.voyage.response;

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
public class VoyageEmbedResponse {

    private String object;
    private List<VoyageEmbeddingData> data;
    private String model;
    private VoyageEmbeddingUsage usage;

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class VoyageEmbeddingData {

        private String object;
        private List<Double> embedding;
        private Integer index;
    }

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class VoyageEmbeddingUsage {

        @JsonProperty("total_tokens")
        private Integer totalTokens;
    }
}
