package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.adapters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.BotRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Ada2Response;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine.AiModelService;

import java.util.List;

public class OpenAiAdapter implements AiModelService {


    @Override
    public EmbeddingResponse askEmbedding(BotRequest botRequest) {

        EmbeddingResponse ada2response = askEmbedding(botRequest);

    }

    @Override
    public CompletionResponse askCompletion(List<Message> messages, String agentRole, String aiModelName, RequestParams requestParams) {
        return null;
    }

    @Override
    public ModerationResponse moderationCheck(String message) {
        return null;
    }
}
