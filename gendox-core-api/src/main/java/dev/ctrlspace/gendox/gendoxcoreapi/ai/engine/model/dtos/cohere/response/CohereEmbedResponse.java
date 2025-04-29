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
    private CohereMetadata meta;

    @JsonProperty("response_type")
    private String responseType;

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Embeddings {
        @JsonProperty("float")
        private List<List<Double>> floats;
    }
}
