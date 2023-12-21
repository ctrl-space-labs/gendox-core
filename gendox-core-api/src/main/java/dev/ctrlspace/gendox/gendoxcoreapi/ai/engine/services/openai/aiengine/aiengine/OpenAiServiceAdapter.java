package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.GPT35Moderation;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.GPTConfig;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.OpenAIADA2;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.EmbeddingResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.OpenAiCompletionResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
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

public class OpenAiServiceAdapter implements AiModelService {


    private Set<String> supportedModels = Set.of("gpt-4", "gpt-3.5-turbo", "text-embedding-ada-002","openai-moderation");
    @Value("${gendox.models.openai.ada2.key}")
    private String ada2key;

    Logger logger = LoggerFactory.getLogger(OpenAiServiceAdapter.class);

    private AiModelRepository aiModelRepository;

    private OpenAiCompletionResponseConverter openAiCompletionResponseConverter;

    private EmbeddingResponseConverter embeddingResponseConverter;

    @Autowired
    public OpenAiServiceAdapter(AiModelRepository aiModelRepository,
                                OpenAiCompletionResponseConverter openAiCompletionResponseConverter,
                                EmbeddingResponseConverter embeddingResponseConverter){
        this.aiModelRepository = aiModelRepository;
        this.embeddingResponseConverter = embeddingResponseConverter;
        this.openAiCompletionResponseConverter = openAiCompletionResponseConverter;
    }
    private static final RestTemplate restTemplate = new RestTemplate();

    public HttpHeaders buildHeader() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(OpenAIADA2.MEDIA_TYPE));
        headers.add(OpenAIADA2.AUTHORIZATION, OpenAIADA2.BEARER + ada2key);
        return headers;
    }


    public OpenAiAda2Response getEmbeddingResponse(OpenAiAda2Request embeddingRequestHttpEntity) {
        logger.debug("Sending Embedding Request to OpenAI: {}", embeddingRequestHttpEntity);
        ResponseEntity<OpenAiAda2Response> responseEntity = restTemplate.postForEntity(
                OpenAIADA2.URL,
                new HttpEntity<>(embeddingRequestHttpEntity, buildHeader()),
                OpenAiAda2Response.class);
        logger.info("Received Embedding Response from OpenAI. Tokens billed: {}", responseEntity.getBody().getUsage().getTotalTokens());

        return responseEntity.getBody();
    }


    public OpenAiGptResponse getCompletionResponse(OpenAiGptRequest chatRequestHttpEntity) {
        logger.debug("Sending completion Request to OpenAI: {}", chatRequestHttpEntity);
        ResponseEntity<OpenAiGptResponse> responseEntity = restTemplate.postForEntity(
                GPTConfig.URL,
                new HttpEntity<>(chatRequestHttpEntity, buildHeader()),
                OpenAiGptResponse.class);
        logger.info("Received completion Response from OpenAI. Tokens billed: {}", responseEntity.getBody().getUsage().getTotalTokens());

        return responseEntity.getBody();
    }

    public OpenAiGpt35ModerationResponse getModerationResponse(Gpt35ModerationRequest moderationRequest) {
        logger.debug("Sending moderation Request to OpenAI: {}", moderationRequest);
        ResponseEntity<OpenAiGpt35ModerationResponse> responseEntity = restTemplate.postForEntity(
                GPT35Moderation.URL,
                new HttpEntity<>(moderationRequest, buildHeader()),
                OpenAiGpt35ModerationResponse.class);
        logger.info("Received moderation Response from OpenAI.");

        return responseEntity.getBody();
    }


    public EmbeddingResponse askEmbedding(BotRequest botRequest, String aiModelName) {
        String message = botRequest.getMessages().get(0);
        OpenAiAda2Response openAiAda2Response = this.getEmbeddingResponse(OpenAiAda2Request.builder()
                .model(aiModelName)
                .input(message).build());

        EmbeddingResponse embeddingResponse = embeddingResponseConverter.OpenAitoEmbeddingResponse(openAiAda2Response);

        return embeddingResponse;

    }

    @Override
    public CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, String aiModelName, AiModelRequestParams aiModelRequestParams) {
        if (Strings.isNotEmpty(agentRole)) {
            messages.add(0, AiModelMessage.builder().role("system").content(agentRole).build());

        }
        OpenAiGptResponse openAiGptResponse = this.getCompletionResponse(OpenAiGptRequest.builder()
                .model(aiModelName)
                .temperature(aiModelRequestParams.getTemperature())
                .topP(aiModelRequestParams.getTopP())
                .maxTokens(aiModelRequestParams.getMaxTokens())
                .messages(messages).build());

        CompletionResponse completionResponse = openAiCompletionResponseConverter.toCompletionResponse(openAiGptResponse);

        return completionResponse;
    }


    public OpenAiGpt35ModerationResponse moderationCheck(String message) {
        return getModerationResponse(Gpt35ModerationRequest.builder()
                .input(message)
                .build());
    }

    @Override
    public boolean supports(String model) {
        return supportedModels.contains(model);
    }


}
