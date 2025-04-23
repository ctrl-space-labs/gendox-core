package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiAda2Response;
import org.springframework.stereotype.Component;

@Component
public class OpenAiEmbeddingResponseConverter {
    public EmbeddingResponse openAitoEmbeddingResponse(OpenAiAda2Response openAiAda2Response) {
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
                .rateLimitResetTokensMilliseconds(openAiAda2Response.getRateLimitResetTokensMilliseconds())

                .build();

        return embeddingResponse;

    }
}
