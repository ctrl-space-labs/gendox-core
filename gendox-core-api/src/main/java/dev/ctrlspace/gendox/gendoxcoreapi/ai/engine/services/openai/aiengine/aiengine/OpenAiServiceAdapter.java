package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelTypeService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.GPT35Moderation;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.OpenAIADA2;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.OpenAiCompletionResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.OpenAiEmbeddingResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.AiModelConstants;
import org.apache.logging.log4j.util.Strings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Set;

@Service
public class OpenAiServiceAdapter implements AiModelTypeService {


    protected Set<String> supportedModels = Set.of(AiModelConstants.GPT_4_OMNI,
            AiModelConstants.GPT_4_OMNI_MINI,
            AiModelConstants.GPT_4_TURBO,
            AiModelConstants.GPT_4,
            AiModelConstants.GPT_3_5_TURBO_MODEL,
            AiModelConstants.ADA2_MODEL,
            AiModelConstants.ADA_3_SMALL,
            AiModelConstants.OPEN_AI_MODERATION);
    protected String serviceName = "OpenAI";

    @Value("${gendox.models.openai.ada2.key}")
    protected String apiKey;

    protected Logger logger = LoggerFactory.getLogger(OpenAiServiceAdapter.class);

    private AiModelRepository aiModelRepository;

    private OpenAiCompletionResponseConverter openAiCompletionResponseConverter;

    private OpenAiEmbeddingResponseConverter openAiEmbeddingResponseConverter;

    @Autowired
    public OpenAiServiceAdapter(AiModelRepository aiModelRepository,
                                OpenAiCompletionResponseConverter openAiCompletionResponseConverter,
                                OpenAiEmbeddingResponseConverter openAiEmbeddingResponseConverter){
        this.aiModelRepository = aiModelRepository;
        this.openAiEmbeddingResponseConverter = openAiEmbeddingResponseConverter;
        this.openAiCompletionResponseConverter = openAiCompletionResponseConverter;
    }
    private static final RestTemplate restTemplate = new RestTemplate();

    public HttpHeaders buildHeader() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(OpenAIADA2.MEDIA_TYPE));
        headers.add(OpenAIADA2.AUTHORIZATION, OpenAIADA2.BEARER + getApiKey());
        return headers;
    }

    public String getApiEndpointByAiModel(String model) {
        return aiModelRepository.findUrlByModel(model);
    }

    public OpenAiAda2Response getEmbeddingResponse(OpenAiAda2Request embeddingRequestHttpEntity, String aiModelName) {
        String embeddingsApiUrl = getApiEndpointByAiModel(aiModelName);
        logger.trace("Sending Embedding Request to {}: {}", this.getServiceName(), embeddingRequestHttpEntity);
        ResponseEntity<OpenAiAda2Response> responseEntity = restTemplate.postForEntity(
                embeddingsApiUrl,
                new HttpEntity<>(embeddingRequestHttpEntity, buildHeader()),
                OpenAiAda2Response.class);
        logger.info("Received Embedding Response from {}. Tokens billed: {}", this.getServiceName(), responseEntity.getBody().getUsage().getTotalTokens());

        return responseEntity.getBody();
    }


    public OpenAiGptResponse getCompletionResponse(OpenAiGptRequest chatRequestHttpEntity, String aiModelName) {
        String completionApiUrl = getApiEndpointByAiModel(aiModelName);
        logger.trace("Sending completion Request to {}: {}", this.getServiceName(), chatRequestHttpEntity);
        ResponseEntity<OpenAiGptResponse> responseEntity = restTemplate.postForEntity(
                completionApiUrl,
                new HttpEntity<>(chatRequestHttpEntity, buildHeader()),
                OpenAiGptResponse.class);
        logger.info("Received completion Response from {}. Tokens billed: {}", this.getServiceName(), responseEntity.getBody().getUsage().getTotalTokens());

        return responseEntity.getBody();
    }

    public OpenAiGpt35ModerationResponse getModerationResponse(Gpt35ModerationRequest moderationRequest) {
        logger.trace("Sending moderation Request to {}: {}", this.getServiceName(), moderationRequest);
        ResponseEntity<OpenAiGpt35ModerationResponse> responseEntity = restTemplate.postForEntity(
                GPT35Moderation.URL,
                new HttpEntity<>(moderationRequest, buildHeader()),
                OpenAiGpt35ModerationResponse.class);
        logger.debug("Received moderation Response from {}.", this.getServiceName());

        return responseEntity.getBody();
    }


    public EmbeddingResponse askEmbedding(BotRequest botRequest, String aiModelName) {
        String message = botRequest.getMessages().get(0);
        OpenAiAda2Response openAiAda2Response = this.getEmbeddingResponse((OpenAiAda2Request.builder()
                .model(aiModelName)
                .input(message).build()),
                aiModelName);

        EmbeddingResponse embeddingResponse = openAiEmbeddingResponseConverter.openAitoEmbeddingResponse(openAiAda2Response);

        return embeddingResponse;

    }

    @Override
    public CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, String aiModelName, AiModelRequestParams aiModelRequestParams) {
        if (Strings.isNotEmpty(agentRole)) {
            messages.add(0, AiModelMessage.builder().role("system").content(agentRole).build());

        }
        OpenAiGptResponse openAiGptResponse = this.getCompletionResponse((OpenAiGptRequest.builder()
                .model(aiModelName)
                .temperature(aiModelRequestParams.getTemperature())
                .topP(aiModelRequestParams.getTopP())
                .maxTokens(aiModelRequestParams.getMaxTokens())
                .messages(messages).build()),
                aiModelName);

        CompletionResponse completionResponse = openAiCompletionResponseConverter.toCompletionResponse(openAiGptResponse);

        return completionResponse;
    }


    public OpenAiGpt35ModerationResponse moderationCheck(String message) {
        return getModerationResponse(Gpt35ModerationRequest.builder()
                .input(message)
                .build());
    }

    @Override
    public boolean supports(AiModel model) {
        return getSupportedModels().contains(model.getName());
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
