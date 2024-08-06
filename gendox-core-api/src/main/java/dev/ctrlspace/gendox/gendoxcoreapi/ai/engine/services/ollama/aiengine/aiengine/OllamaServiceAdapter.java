package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.ollama.aiengine.aiengine;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiGpt35ModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelTypeService;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Set;

public class OllamaServiceAdapter implements AiModelTypeService {

    protected Set<String> supportedApiTypeNames = Set.of("OLLAMA_API");


    protected Logger logger = LoggerFactory.getLogger(OllamaServiceAdapter.class);

    private AiModelRepository aiModelRepository;

    @Override
    public EmbeddingResponse askEmbedding(BotRequest botRequest, AiModel aiModel, String apiKey) {
        return null;
    }

    @Override
    public CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, AiModel aiModel, AiModelRequestParams aiModelRequestParams, String apiKey) {
        return null;
    }

    @Override
    public OpenAiGpt35ModerationResponse moderationCheck(String message, String apiKey) {
        return null;
    }

    @Override
    public boolean supports(String apiTypeName) {
        return supportedApiTypeNames.contains(apiTypeName);
    }

    @Override
    public Set<String> getSupportedApiTypeNames() {
        return supportedApiTypeNames;
    }
}
