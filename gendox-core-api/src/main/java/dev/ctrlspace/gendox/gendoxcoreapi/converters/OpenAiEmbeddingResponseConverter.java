package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiEmbeddingResponse;
import org.springframework.stereotype.Component;

@Component
public class OpenAiEmbeddingResponseConverter {
    public EmbeddingResponse openAitoEmbeddingResponse(OpenAiEmbeddingResponse openAiEmbeddingResponse) {
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
                .rateLimitResetTokensMilliseconds(openAiEmbeddingResponse.getRateLimitResetTokensMilliseconds())

                .build();

        return embeddingResponse;

    }
}
