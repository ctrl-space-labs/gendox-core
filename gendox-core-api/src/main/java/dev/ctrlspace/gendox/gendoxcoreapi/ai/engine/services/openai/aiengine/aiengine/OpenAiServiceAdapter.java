package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.GPT35Moderation;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.OpenAIADA2;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.OpenAiCompletionResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.OpenAiEmbeddingResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.DurationUtils;
import org.apache.logging.log4j.util.Strings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class OpenAiServiceAdapter implements AiModelApiAdapterService {


    protected Set<String> supportedApiType = Set.of("OPEN_AI_API");


    protected Logger logger = LoggerFactory.getLogger(OpenAiServiceAdapter.class);

    private AiModelRepository aiModelRepository;

    private OpenAiCompletionResponseConverter openAiCompletionResponseConverter;

    private OpenAiEmbeddingResponseConverter openAiEmbeddingResponseConverter;

    private DurationUtils durationUtils;

    @Autowired
    public OpenAiServiceAdapter(AiModelRepository aiModelRepository,
                                OpenAiCompletionResponseConverter openAiCompletionResponseConverter,
                                OpenAiEmbeddingResponseConverter openAiEmbeddingResponseConverter,
                                DurationUtils durationUtils) {
        this.aiModelRepository = aiModelRepository;
        this.openAiEmbeddingResponseConverter = openAiEmbeddingResponseConverter;
        this.openAiCompletionResponseConverter = openAiCompletionResponseConverter;
        this.durationUtils = durationUtils;
    }

    private static final RestTemplate restTemplate = new RestTemplate();

    public HttpHeaders buildHeader(String apiKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(OpenAIADA2.MEDIA_TYPE));
        headers.add(OpenAIADA2.AUTHORIZATION, OpenAIADA2.BEARER + apiKey);
        return headers;
    }

    public String getApiEndpointByAiModel(String model) {
        return aiModelRepository.findUrlByModel(model);
    }

    public OpenAiAda2Response getEmbeddingResponse(OpenAiAda2Request embeddingRequestHttpEntity, AiModel aiModel, String apiKey) {
        String embeddingsApiUrl = aiModel.getUrl();
        logger.trace("Sending Embedding Request to {}: {}", embeddingsApiUrl, embeddingRequestHttpEntity);
        ResponseEntity<OpenAiAda2Response> responseEntity = restTemplate.postForEntity(
                embeddingsApiUrl,
                new HttpEntity<>(embeddingRequestHttpEntity, buildHeader(apiKey)),
                OpenAiAda2Response.class);

        // Extract rate limit headers
        HttpHeaders headers = responseEntity.getHeaders();
        RateLimitInfo rateLimitInfo = extractRateLimitHeaders(headers);

        logger.info("Received Embedding Response from {}. Tokens billed: {}", embeddingsApiUrl, responseEntity.getBody().getUsage().getTotalTokens());


        OpenAiAda2Response openAiAda2Response = responseEntity.getBody();

        openAiAda2Response.setTotalRateLimitRequests(rateLimitInfo.getTotalRateLimitRequests());
        openAiAda2Response.setTotalRateLimitTokens(rateLimitInfo.getTotalRateLimitTokens());
        openAiAda2Response.setRateLimitRemainingRequests(rateLimitInfo.getRateLimitRemainingRequests());
        openAiAda2Response.setRateLimitRemainingTokens(rateLimitInfo.getRateLimitRemainingTokens());
        openAiAda2Response.setRateLimitResetRequestsMilliseconds(rateLimitInfo.getRateLimitResetRequestsMilliseconds());
        openAiAda2Response.setRateLimitResetTokensMilliseconds(rateLimitInfo.getRateLimitResetTokensMilliseconds());




        return openAiAda2Response;
    }


    public OpenAiGptResponse getCompletionResponse(OpenAiGptRequest chatRequestHttpEntity, AiModel aiModel, String apiKey) {
        String completionApiUrl = aiModel.getUrl();
        logger.trace("Sending completion Request to {}: {}", completionApiUrl, chatRequestHttpEntity);
        ResponseEntity<OpenAiGptResponse> responseEntity = restTemplate.postForEntity(
                completionApiUrl,
                new HttpEntity<>(chatRequestHttpEntity, buildHeader(apiKey)),
                OpenAiGptResponse.class);
        logger.info("Received completion Response from {}. Prompt Tokens billed: {}", completionApiUrl, responseEntity.getBody().getUsage().getPromptTokens());
        logger.info("Received completion Response from {}. Completion Tokens billed: {}", completionApiUrl, responseEntity.getBody().getUsage().getCompletionTokens());
        logger.info("Received completion Response from {}. Tokens billed: {}", completionApiUrl, responseEntity.getBody().getUsage().getTotalTokens());

        return responseEntity.getBody();
    }

    public OpenAiGpt35ModerationResponse getModerationResponse(Gpt35ModerationRequest moderationRequest, String apiKey) {
        logger.trace("Sending moderation Request to {}: {}", GPT35Moderation.URL, moderationRequest);
        ResponseEntity<OpenAiGpt35ModerationResponse> responseEntity = restTemplate.postForEntity(
                GPT35Moderation.URL,
                new HttpEntity<>(moderationRequest, buildHeader(apiKey)),
                OpenAiGpt35ModerationResponse.class);
        logger.debug("Received moderation Response from {}.", GPT35Moderation.URL);

        return responseEntity.getBody();
    }


    public EmbeddingResponse askEmbedding(BotRequest botRequest, AiModel aiModel, String apiKey) {
        String message = botRequest.getMessages().get(0);
        OpenAiAda2Response openAiAda2Response = this.getEmbeddingResponse((OpenAiAda2Request.builder()
                        .model(aiModel.getModel())
                        .input(message).build()),
                aiModel,
                apiKey);

        EmbeddingResponse embeddingResponse = openAiEmbeddingResponseConverter.openAitoEmbeddingResponse(openAiAda2Response);

        return embeddingResponse;

    }

    @Override
    public CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, AiModel aiModel, AiModelRequestParams aiModelRequestParams, String apiKey) {
        if (Strings.isNotEmpty(agentRole)) {
            messages.add(0, AiModelMessage.builder().role("system").content(agentRole).build());

        }
        OpenAiGptResponse openAiGptResponse = this.getCompletionResponse((OpenAiGptRequest.builder()
                        .model(aiModel.getModel())
                        .temperature(aiModelRequestParams.getTemperature())
                        .topP(aiModelRequestParams.getTopP())
                        .maxTokens(aiModelRequestParams.getMaxTokens())
                        .messages(messages).build()),
                aiModel,
                apiKey);

        CompletionResponse completionResponse = openAiCompletionResponseConverter.toCompletionResponse(openAiGptResponse);

        return completionResponse;
    }


    public OpenAiGpt35ModerationResponse moderationCheck(String message, String apiKey) {
        return getModerationResponse(Gpt35ModerationRequest.builder()
                        .input(message)
                        .build(),
                apiKey);
    }

    public RateLimitInfo extractRateLimitHeaders(HttpHeaders headers) {
        RateLimitInfo rateLimitInfo = new RateLimitInfo();

        // Extracting values and setting them if they exist
        Optional.ofNullable(headers.getFirst("x-ratelimit-limit-requests"))
                .map(Long::valueOf)
                .ifPresent(rateLimitInfo::setTotalRateLimitRequests);

        Optional.ofNullable(headers.getFirst("x-ratelimit-limit-tokens"))
                .map(Long::valueOf)
                .ifPresent(rateLimitInfo::setTotalRateLimitTokens);

        Optional.ofNullable(headers.getFirst("x-ratelimit-remaining-requests"))
                .map(Long::valueOf)
                .ifPresent(rateLimitInfo::setRateLimitRemainingRequests);

        Optional.ofNullable(headers.getFirst("x-ratelimit-remaining-tokens"))
                .map(Long::valueOf)
                .ifPresent(rateLimitInfo::setRateLimitRemainingTokens);

        Optional.ofNullable(headers.getFirst("x-ratelimit-reset-requests"))
                .map(durationUtils::convertToMilliseconds) // Using the injected DurationUtils
                .ifPresent(rateLimitInfo::setRateLimitResetRequestsMilliseconds);

        Optional.ofNullable(headers.getFirst("x-ratelimit-reset-tokens"))
                .map(durationUtils::convertToMilliseconds) // Using the injected DurationUtils
                .ifPresent(rateLimitInfo::setRateLimitResetTokensMilliseconds);

        return rateLimitInfo;
    }





    @Override
    public boolean supports(String apiTypeName) {
        return getSupportedApiTypeNames().contains(apiTypeName);
    }

    @Override
    public Set<String> getSupportedApiTypeNames() {
        return supportedApiType;
    }

}
