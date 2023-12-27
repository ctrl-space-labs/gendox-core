package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiAda2Response;

public class OpenAiEmbeddingResponseConverter {
    public EmbeddingResponse openAitoEmbeddingResponse(OpenAiAda2Response openAiAda2Response) {
        EmbeddingResponse embeddingResponse = EmbeddingResponse.builder()
                .object(openAiAda2Response.getObject())
                .model(openAiAda2Response.getModel())
                .usage(openAiAda2Response.getUsage())
                .data(openAiAda2Response.getData())
                .build();

        return embeddingResponse;

    }
}
