package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Ada2Response;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Embedding;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
public class OpenAiEmbeddingConverter implements GendoxConverter<Embedding, Ada2Response> {
    @Override
    public Ada2Response toDTO(Embedding embedding) {
        throw new UnsupportedOperationException();
    }

    @Override
    public Embedding toEntity(Ada2Response ada2Response) {
        Embedding embedding = new Embedding();

        embedding.setEmbeddingVector(ada2Response.getData().get(0).getEmbedding());

        return embedding;
    }
}
