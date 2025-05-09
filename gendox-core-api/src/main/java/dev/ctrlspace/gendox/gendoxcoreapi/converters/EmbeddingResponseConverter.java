package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.*;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class EmbeddingResponseConverter {

    private static List<Double> zeros = Collections.nCopies(512, 0.0);

    public EmbeddingResponse OpenAitoEmbeddingResponse(OpenAiEmbeddingResponse openAiEmbeddingResponse) {
        EmbeddingResponse embeddingResponse = EmbeddingResponse.builder()
                .object(openAiEmbeddingResponse.getObject())
                .model(openAiEmbeddingResponse.getModel())
                .usage(openAiEmbeddingResponse.getUsage())
                .data(openAiEmbeddingResponse.getData())
                .totalRateLimitRequests(openAiEmbeddingResponse.getTotalRateLimitRequests())
                .totalRateLimitTokens(openAiEmbeddingResponse.getTotalRateLimitTokens())
                .rateLimitRemainingRequests(openAiEmbeddingResponse.getRateLimitRemainingRequests())
                .rateLimitRemainingTokens(openAiEmbeddingResponse.getRateLimitRemainingTokens())
                .rateLimitResetRequestsMilliseconds(openAiEmbeddingResponse.getRateLimitResetRequestsMilliseconds())
                .rateLimitResetRequestsMilliseconds(openAiEmbeddingResponse.getRateLimitResetTokensMilliseconds())


                .build();

        return embeddingResponse;

    }

//    public EmbeddingResponse coheretoEmbeddingResponse(CohereEmbedMultilingualResponse cohereEmbedMultilingualResponse,
//                                                       String aiModel) {
//        int i = 0;
//
//        List<EmbeddingData> embeddingDataList = new ArrayList<>();
//        for (List<Double> data : cohereEmbedMultilingualResponse.getEmbeddings()) {
//            data.addAll(zeros);
//            embeddingDataList.add(new EmbeddingData(data, i++,null));
//        }
//
//
//        Usage usage = Usage.builder()
//                .completionTokens(cohereEmbedMultilingualResponse.getMeta().getBilledUnits().getOutputTokens())
//                .promptTokens(cohereEmbedMultilingualResponse.getMeta().getBilledUnits().getInputTokens())
//                .totalTokens(cohereEmbedMultilingualResponse.getMeta().getBilledUnits().getInputTokens() +
//                            cohereEmbedMultilingualResponse.getMeta().getBilledUnits().getOutputTokens())
//                .build();
//        EmbeddingResponse embeddingResponse = EmbeddingResponse.builder()
//                .model(aiModel)
//                .usage(usage)
//                .data(embeddingDataList)
//                .build();
//
//        return embeddingResponse;
//
//    }


}
