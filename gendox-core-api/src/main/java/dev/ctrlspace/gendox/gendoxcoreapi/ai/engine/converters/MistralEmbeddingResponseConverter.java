package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.response.MistralEmbedResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.EmbeddingData;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Usage;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MistralEmbeddingResponseConverter {

    public EmbeddingResponse mistraltoEmbeddingResponse(MistralEmbedResponse mistralEmbedResponse) {
        List<EmbeddingData> embeddingDataList = mistralEmbedResponse.getData().stream()
                .map(data -> new EmbeddingData(data.getEmbedding(), data.getIndex(), data.getObject()))
                .toList();

        Usage usage = Usage.builder()
                .completionTokens(mistralEmbedResponse.getUsage().getCompletion_tokens())
                .promptTokens(mistralEmbedResponse.getUsage().getPrompt_tokens())
                .totalTokens(mistralEmbedResponse.getUsage().getTotal_tokens())
                .build();


        EmbeddingResponse embeddingResponse = EmbeddingResponse.builder()
                .model(mistralEmbedResponse.getModel())
                .data(embeddingDataList)
                .object(mistralEmbedResponse.getObject())
                .usage(usage)
                .build();

        return embeddingResponse;
    }

}
