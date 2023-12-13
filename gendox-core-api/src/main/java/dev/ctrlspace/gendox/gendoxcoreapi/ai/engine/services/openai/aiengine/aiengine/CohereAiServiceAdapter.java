package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.BotRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.AiModelRequestParams;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiGpt35ModerationResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
@Qualifier("openAiServiceAdapter")
public class CohereAiServiceAdapter implements AiModelService{


    private Set<String> supportedModels = Set.of("cohere-coral");


    @Override
    public EmbeddingResponse askEmbedding(BotRequest botRequest, String aiModelName) {
        throw new UnsupportedOperationException("Not supported yet");
    }

    @Override
    public CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, String aiModelName, AiModelRequestParams aiModelRequestParams) {
        throw new UnsupportedOperationException("Not supported yet");
    }

    @Override
    public OpenAiGpt35ModerationResponse moderationCheck(String message) {
        return null;
    }


    @Override
    public boolean supports(String model) {
        return supportedModels.contains(model);
    }
}
