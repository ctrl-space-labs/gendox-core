package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiAda2Response;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentDTO;
import org.springframework.stereotype.Component;

@Component
public class EmbeddingResponseConverter {


    public EmbeddingResponse toEmbeddingResponse(OpenAiAda2Response openAiAda2Response) {
        EmbeddingResponse embeddingResponse = EmbeddingResponse.builder()
                .object(openAiAda2Response.getObject())
                .model(openAiAda2Response.getModel())
                .usage(openAiAda2Response.getUsage())
                .data(openAiAda2Response.getData())
                .build();

        return embeddingResponse;

    }


}
