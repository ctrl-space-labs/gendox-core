package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.AiModelMessage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class CohereEmbedMultilingualResponse {
//    private List<AiModelMessage> texts;
//    private List<String> texts;
//    private List<EmbeddingData> data;
//    private String model;
//    private BilledUnits billedUnits;
    private String id;
    private List<String> texts;
    private List<List<Double>> embeddings;
    private CohereMetadata meta;
    private String response_type;
}


