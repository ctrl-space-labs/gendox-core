package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiEmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Embedding;
import org.springframework.stereotype.Component;

@Component
public class OpenAiEmbeddingConverter implements GendoxConverter<Embedding, OpenAiEmbeddingResponse> {
    @Override
    public OpenAiEmbeddingResponse toDTO(Embedding embedding) {
        throw new UnsupportedOperationException();
    }

    @Override
    public Embedding toEntity(OpenAiEmbeddingResponse openAiEmbeddingResponse) {
        Embedding embedding = new Embedding();

        embedding.setEmbeddingVector(openAiEmbeddingResponse.getData().get(0).getEmbedding());

        return embedding;
    }
}
