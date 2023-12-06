package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiAda2Response;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Embedding;
import org.springframework.stereotype.Component;

@Component
public class OpenAiEmbeddingConverter implements GendoxConverter<Embedding, OpenAiAda2Response> {
    @Override
    public OpenAiAda2Response toDTO(Embedding embedding) {
        throw new UnsupportedOperationException();
    }

    @Override
    public Embedding toEntity(OpenAiAda2Response openAiAda2Response) {
        Embedding embedding = new Embedding();

        embedding.setEmbeddingVector(openAiAda2Response.getData().get(0).getEmbedding());

        return embedding;
    }
}
