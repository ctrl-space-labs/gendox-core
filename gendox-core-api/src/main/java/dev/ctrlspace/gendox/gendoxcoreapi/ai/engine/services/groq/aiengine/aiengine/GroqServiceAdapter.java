package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.groq.aiengine.aiengine;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelTypeService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine.OpenAiServiceAdapter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.OpenAiCompletionResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.OpenAiEmbeddingResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.AiModelConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Set;

/**
 * Integrates with Groq Service. The API is compatible with OpenAI API.
 *
 */
@Service
public class GroqServiceAdapter extends OpenAiServiceAdapter implements AiModelTypeService {

    protected Set<String> supportedModels = Set.of(AiModelConstants.GROQ_LLAMA_3_70B_8192, AiModelConstants.GROQ_LLAMA_3_8B_8192);

    @Value("${gendox.models.groq.key}")
    protected String apiKey;

    protected Logger logger = LoggerFactory.getLogger(GroqServiceAdapter.class);

    protected String serviceName;


    @Autowired
    public GroqServiceAdapter(AiModelRepository aiModelRepository,
                              OpenAiCompletionResponseConverter openAiCompletionResponseConverter,
                              OpenAiEmbeddingResponseConverter openAiEmbeddingResponseConverter) {
        super(aiModelRepository, openAiCompletionResponseConverter, openAiEmbeddingResponseConverter);
    }

    @Override
    public String getServiceName() {
        return serviceName;
    }

    @Override
    public Set<String> getSupportedModels() {
        return supportedModels;
    }

    public String getApiKey() {
        return apiKey;
    }
}
