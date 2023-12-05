package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.AiMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.BotRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.RequestParams;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.ModerationResponse;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
public class CohereAiServiceAdapter implements AiModelService{


    private Set<String> supportedModels = Set.of("cohere-coral");


    @Override
    public EmbeddingResponse askEmbedding(BotRequest botRequest) {
        throw new UnsupportedOperationException("Not supported yet");
    }

    @Override
    public CompletionResponse askCompletion(List<AiMessage> messages, String agentRole, String aiModelName, RequestParams requestParams) {
        throw new UnsupportedOperationException("Not supported yet");
    }

    @Override
    public ModerationResponse moderationCheck(String message) {
        throw new UnsupportedOperationException("Not supported yet");
    }

    @Override
    public boolean supports(String model) {
        return supportedModels.contains(model);
    }
}
