package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response.CohereEmbedResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.EmbeddingData;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Usage;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class CohereEmbeddingResponseConverter {


    public EmbeddingResponse coheretoEmbeddingResponse(CohereEmbedResponse cohereEmbedResponse, AiModel aiModel) {
        List<EmbeddingData> embeddingDataList = new ArrayList<>();
        List<List<Float>> embeddings = cohereEmbedResponse.getEmbeddings().get_float();
        List<String> texts = cohereEmbedResponse.getTexts();

        for (int i = 0; i < embeddings.size(); i++) {
            List<Double> doubleEmbedding = embeddings.get(i)
                    .stream()
                    .map(Float::doubleValue)
                    .collect(Collectors.toList());

            embeddingDataList.add(
                    EmbeddingData.builder()
                            .embedding(doubleEmbedding)
                            .index(i)
                            .object("embedding")
                            .build()
            );
        }


        CohereEmbedResponse.BilledUnits billedUnits = cohereEmbedResponse.getMeta().getBilled_units();

        Usage usage = Usage.builder()
                .promptTokens(billedUnits != null ? billedUnits.getInput_tokens() : 0)
                .completionTokens(0)
                .totalTokens(billedUnits != null ? billedUnits.getInput_tokens() : 0)
                .build();




        EmbeddingResponse embeddingResponse = EmbeddingResponse.builder()
                .model(aiModel.getModel())
                .usage(usage)
                .data(embeddingDataList)
                .build();

        return embeddingResponse;

    }
}
