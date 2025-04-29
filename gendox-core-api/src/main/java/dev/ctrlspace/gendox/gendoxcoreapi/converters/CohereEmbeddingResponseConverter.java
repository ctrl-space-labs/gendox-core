package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response.CohereEmbedResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.EmbeddingData;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Usage;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class CohereEmbeddingResponseConverter {

    private static List<Double> zeros = Collections.nCopies(512, 0.0);

    public EmbeddingResponse coheretoEmbeddingResponse(CohereEmbedResponse cohereEmbedResponse,
                                                       AiModel aiModel) {
        int i = 0;

        List<EmbeddingData> embeddingDataList = new ArrayList<>();
        for (List<Double> data : cohereEmbedResponse.getEmbeddings().getFloats()) {
            data.addAll(zeros);
            embeddingDataList.add(new EmbeddingData(data, i++,null));
        }


        Usage usage = Usage.builder()
                .completionTokens(0)
                .promptTokens(cohereEmbedResponse.getMeta().getBilledUnits().getInputTokens())
                .totalTokens(cohereEmbedResponse.getMeta().getBilledUnits().getInputTokens())
                .build();
        EmbeddingResponse embeddingResponse = EmbeddingResponse.builder()
                .model(aiModel.getModel())
                .usage(usage)
                .data(embeddingDataList)
                .build();

        return embeddingResponse;

    }
}
