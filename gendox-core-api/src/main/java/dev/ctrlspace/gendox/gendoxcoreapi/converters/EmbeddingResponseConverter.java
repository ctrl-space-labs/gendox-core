package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response.CohereEmbedMultilingualResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.*;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class EmbeddingResponseConverter {

    private static List<Double> zeros = Collections.nCopies(512, 0.0);

    public EmbeddingResponse OpenAitoEmbeddingResponse(OpenAiAda2Response openAiAda2Response) {
        EmbeddingResponse embeddingResponse = EmbeddingResponse.builder()
                .object(openAiAda2Response.getObject())
                .model(openAiAda2Response.getModel())
                .usage(openAiAda2Response.getUsage())
                .data(openAiAda2Response.getData())
                .totalRateLimitRequests(openAiAda2Response.getTotalRateLimitRequests())
                .totalRateLimitTokens(openAiAda2Response.getTotalRateLimitTokens())
                .rateLimitRemainingRequests(openAiAda2Response.getRateLimitRemainingRequests())
                .rateLimitRemainingTokens(openAiAda2Response.getRateLimitRemainingTokens())
                .rateLimitResetRequestsMilliseconds(openAiAda2Response.getRateLimitResetRequestsMilliseconds())
                .rateLimitResetRequestsMilliseconds(openAiAda2Response.getRateLimitResetTokensMilliseconds())


                .build();

        return embeddingResponse;

    }

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
