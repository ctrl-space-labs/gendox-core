package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response.CohereEmbedMultilingualResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.EmbeddingData;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Usage;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class CohereEmbeddingResponseConverter {

    private static List<Double> zeros = Collections.nCopies(512, 0.0);

    public EmbeddingResponse coheretoEmbeddingResponse(CohereEmbedMultilingualResponse cohereEmbedMultilingualResponse,
                                                       String aiModel) {
        int i = 0;

        List<EmbeddingData> embeddingDataList = new ArrayList<>();
        for (List<Double> data : cohereEmbedMultilingualResponse.getEmbeddings()) {
            data.addAll(zeros);
            embeddingDataList.add(new EmbeddingData(data, i++,null));
        }


        Usage usage = Usage.builder()
                .completionTokens(cohereEmbedMultilingualResponse.getMeta().getBilledUnits().getOutputTokens())
                .promptTokens(cohereEmbedMultilingualResponse.getMeta().getBilledUnits().getInputTokens())
                .totalTokens(cohereEmbedMultilingualResponse.getMeta().getBilledUnits().getInputTokens() +
                        cohereEmbedMultilingualResponse.getMeta().getBilledUnits().getOutputTokens())
                .build();
        EmbeddingResponse embeddingResponse = EmbeddingResponse.builder()
                .model(aiModel)
                .usage(usage)
                .data(embeddingDataList)
                .build();

        return embeddingResponse;

    }
}
