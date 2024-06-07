package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.ollama.aiengine.aiengine;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiGpt35ModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelTypeService;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.AiModelConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Set;

public class OllamaServiceAdapter implements AiModelTypeService {

    protected Set<String> supportedModels = Set.of(AiModelConstants.OLLAMA_MISTRAL_8B);
    protected String serviceName = "Ollama";


    protected Logger logger = LoggerFactory.getLogger(OllamaServiceAdapter.class);

    private AiModelRepository aiModelRepository;

    @Override
    public EmbeddingResponse askEmbedding(BotRequest botRequest, String aiModelName) {
        return null;
    }

    @Override
    public CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, String aiModelName, AiModelRequestParams aiModelRequestParams) {
        return null;
    }

    @Override
    public String getServiceName() {
        return serviceName;
    }

    @Override
    public OpenAiGpt35ModerationResponse moderationCheck(String message) {
        return null;
    }

    @Override
    public boolean supports(AiModel model) {
        return supportedModels.contains(model.getName());
    }

    @Override
    public Set<String> getSupportedModels() {
        return supportedModels;
    }
}
