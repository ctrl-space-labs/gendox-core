package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class MistralEmbedResponse {

    private String id;
    private String object;
    private String model;
    private Usage usage;
    private List<EmbeddingData> data;

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Usage {
        private Integer prompt_tokens;
        private Integer completion_tokens;
        private Integer total_tokens;
    }

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class EmbeddingData {
        private String object;
        private List<Double> embedding;
        private Integer index;
    }
}

