package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Embedding;
import org.springframework.stereotype.Component;

@Component
public class AiModelEmbeddingConverter implements GendoxConverter<Embedding, EmbeddingResponse> {

    @Override
    public EmbeddingResponse toDTO(Embedding embedding) {
        throw new UnsupportedOperationException();
    }

    @Override
    public Embedding toEntity(EmbeddingResponse embeddingResponse) {
        Embedding embedding = new Embedding();

        embedding.setEmbeddingVector(embeddingResponse.getData().get(0).getEmbedding());

        return embedding;
    }
}
