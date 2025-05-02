package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.EmbeddingData;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Usage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.voyage.response.VoyageEmbedResponse;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class VoyageEmbeddingResponseConverter {

    public EmbeddingResponse voyagetoEmbeddingResponse(VoyageEmbedResponse voyageEmbedResponse) {

        List<EmbeddingData> embeddingDataList = voyageEmbedResponse.getData().stream()
                .map(data -> new EmbeddingData(data.getEmbedding(), data.getIndex(), data.getObject()))
                .toList();

        Usage usage = Usage.builder()
                .completionTokens(0)
                .promptTokens(voyageEmbedResponse.getUsage().getTotalTokens())
                .totalTokens(voyageEmbedResponse.getUsage().getTotalTokens())
                .build();

        EmbeddingResponse embeddingResponse = EmbeddingResponse.builder()
                .model(voyageEmbedResponse.getModel())
                .data(embeddingDataList)
                .object(voyageEmbedResponse.getObject())
                .usage(usage)
                .build();

        return embeddingResponse;
    }
}
