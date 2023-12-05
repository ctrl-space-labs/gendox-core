package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Ada2Response;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Gpt35ModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.GptResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.GPT35Moderation;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.GPT35TurboConfig;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.OpenAIADA2;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.CompletionResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
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
public class OpenAiServiceAdapter implements AiModelService{


    private Set<String> supportedModels = Set.of("gpt-4", "gpt.3.5-turbo", "ada2");
    @Value("${gendox.models.openai.ada2.key}")
    private String ada2key;

    Logger logger = LoggerFactory.getLogger(OpenAiServiceAdapter.class);

    @Autowired
    private ProjectService projectService;

    @Autowired
    private AiModelRepository aiModelRepository;

    private  CompletionResponseConverter completionResponseConverter;
    private static final RestTemplate restTemplate = new RestTemplate();

    public HttpHeaders buildHeader() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(OpenAIADA2.MEDIA_TYPE));
        headers.add(OpenAIADA2.AUTHORIZATION, OpenAIADA2.BEARER + ada2key);
        return headers;
    }


    public Ada2Response getEmbeddingResponse(Ada2Request embeddingRequestHttpEntity) {
        logger.debug("Sending Embedding Request to OpenAI: {}", embeddingRequestHttpEntity);
        ResponseEntity<Ada2Response> responseEntity = restTemplate.postForEntity(
                OpenAIADA2.URL,
                new HttpEntity<>(embeddingRequestHttpEntity, buildHeader()),
                Ada2Response.class);
        logger.info("Received Embedding Response from OpenAI. Tokens billed: {}", responseEntity.getBody().getUsage().getTotalTokens());

        return responseEntity.getBody();
    }


    public GptResponse getCompletionResponse(GptRequest chatRequestHttpEntity) {
        logger.debug("Sending completion Request to OpenAI: {}", chatRequestHttpEntity);
        ResponseEntity<GptResponse> responseEntity = restTemplate.postForEntity(
                GPT35TurboConfig.URL,
                new HttpEntity<>(chatRequestHttpEntity, buildHeader()),
                GptResponse.class);
        logger.info("Received completion Response from OpenAI. Tokens billed: {}", responseEntity.getBody().getUsage().getTotalTokens());

        return responseEntity.getBody();
    }

    public Gpt35ModerationResponse getModerationResponse(Gpt35ModerationRequest moderationRequest) {
        logger.debug("Sending moderation Request to OpenAI: {}", moderationRequest);
        ResponseEntity<Gpt35ModerationResponse> responseEntity = restTemplate.postForEntity(
                GPT35Moderation.URL,
                new HttpEntity<>(moderationRequest, buildHeader()),
                Gpt35ModerationResponse.class);
        logger.info("Received moderation Response from OpenAI.");

        return responseEntity.getBody();
    }


    public Ada2Response askEmbedding(BotRequest botRequest) {
        return this.getEmbeddingResponse(Ada2Request.builder()
                .model(OpenAIADA2.MODEL)
                .input(botRequest.getMessage()).build());
    }

    @Override
    public CompletionResponse askCompletion(List<AiMessage> messages, String agentRole, String aiModelName, RequestParams requestParams) {
        if (Strings.isNotEmpty(agentRole)) {
            messages.add(0, AiMessage.builder().role("system").content(agentRole).build());

        }
        GptResponse gptResponse = this.getCompletionResponse(GptRequest.builder()
                .model(aiModelName)
                .temperature(requestParams.getTemperature())
                .topP(requestParams.getTopP())
                .maxTokens(requestParams.getMaxTokens())
                .messages(messages).build());

        CompletionResponse completionResponse = completionResponseConverter.toCompletionResponse(gptResponse);

        return completionResponse;
    }

    @Override
    public Gpt35ModerationResponse moderationCheck(String message) {
        return getModerationResponse(Gpt35ModerationRequest.builder()
                .input(message)
                .build());
    }

    @Override
    public boolean supports(String model) {
        return supportedModels.contains(model);
    }


}
