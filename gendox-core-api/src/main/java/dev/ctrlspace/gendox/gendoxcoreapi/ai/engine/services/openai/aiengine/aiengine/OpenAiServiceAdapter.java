package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine;

import com.knuddels.jtokkit.Encodings;
import com.knuddels.jtokkit.api.Encoding;
import com.knuddels.jtokkit.api.EncodingRegistry;
import com.knuddels.jtokkit.api.ModelType;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.GPT35Moderation;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.OpenAIADA2;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.OpenAiCompletionResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.OpenAiEmbeddingResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ApiRateLimitService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.DurationUtils;
import io.github.bucket4j.Bucket;
import org.apache.logging.log4j.util.Strings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class OpenAiServiceAdapter implements AiModelApiAdapterService {


    protected Set<String> supportedApiType = Set.of("OPEN_AI_API");


    protected Logger logger = LoggerFactory.getLogger(OpenAiServiceAdapter.class);

    private AiModelRepository aiModelRepository;

    private OpenAiCompletionResponseConverter openAiCompletionResponseConverter;

    private OpenAiEmbeddingResponseConverter openAiEmbeddingResponseConverter;

    private DurationUtils durationUtils;

    private ApiRateLimitService apiRateLimitService;

    @Autowired
    public OpenAiServiceAdapter(AiModelRepository aiModelRepository,
                                ApiRateLimitService apiRateLimitService,
                                OpenAiCompletionResponseConverter openAiCompletionResponseConverter,
                                OpenAiEmbeddingResponseConverter openAiEmbeddingResponseConverter,
                                DurationUtils durationUtils) {
        this.aiModelRepository = aiModelRepository;
        this.apiRateLimitService = apiRateLimitService;
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

//        Bucket bucket = waitOpenAiRateLimit(embeddingRequestHttpEntity, apiKey);

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

        // TODO update rate limit bucket
        // For now just sleep for a small amount of time when we are near the API limits

        sleepIfLowRateLimit(openAiAda2Response);


        return openAiAda2Response;
    }

    /**
     * @param openAiAda2Response
     */
    private void sleepIfLowRateLimit(OpenAiAda2Response openAiAda2Response) {
        // Check if remaining requests or tokens are less than 10% of the total
        boolean isLowOnRequests = openAiAda2Response.getRateLimitRemainingRequests() != null &&
                openAiAda2Response.getRateLimitRemainingRequests() < 0.1 * openAiAda2Response.getTotalRateLimitRequests();
        boolean isLowOnTokens = openAiAda2Response.getRateLimitRemainingTokens() != null &&
                openAiAda2Response.getRateLimitRemainingTokens() < 0.1 * openAiAda2Response.getTotalRateLimitTokens();

        if (isLowOnRequests || isLowOnTokens) {
            // Get the reset times in milliseconds
            long resetRequestsMillis = openAiAda2Response.getRateLimitResetRequestsMilliseconds();
            long resetTokensMillis = openAiAda2Response.getRateLimitResetTokensMilliseconds();

            // Calculate the maximum of the reset times
            long maxResetMillis = Math.max(resetRequestsMillis, resetTokensMillis);

            // Compute sleep time as 10 times the maximum reset time
            long sleepTimeMillis = 10 * maxResetMillis;

            // Cap the sleep time at 3000 milliseconds (3 seconds)
            sleepTimeMillis = Math.min(sleepTimeMillis, 3000);

            // Log the sleep action (optional but recommended)
            logger.info("Rate limits are low. Sleeping for {} milliseconds.", sleepTimeMillis);

            // Sleep the thread
            try {
                Thread.sleep(sleepTimeMillis);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt(); // Restore the interrupted status
                // Handle interruption if necessary
                logger.warn("Thread was interrupted while sleeping due to rate limiting.", e);
            }
        }
    }

    /**
     * This limits requests sent to OpenAI to not pass the rate limits
     * TODO Not implemented yet, complex logic should be applied to update the limits depending the actual usage of the API
     *
     * @param embeddingRequestHttpEntity
     * @param apiKey
     * @throws GendoxException
     */
    private Bucket waitOpenAiRateLimit(OpenAiAda2Request embeddingRequestHttpEntity, String apiKey) throws GendoxException {
        logger.debug("Applying OpenAI rate Limit wait for Embedding API");
        EncodingRegistry registry = Encodings.newDefaultEncodingRegistry();
        Encoding enc = registry.getEncodingForModel(ModelType.TEXT_EMBEDDING_3_SMALL);
        int requestTokens = enc.encode(embeddingRequestHttpEntity.getInput()).size();
        Bucket bucket = apiRateLimitService.getOpenAIRateLimitBucketForApiKey(apiKey, 1000000);


        boolean consumed = bucket.asBlocking().tryConsumeUninterruptibly(requestTokens, Duration.of(5, ChronoUnit.SECONDS));
        if (!consumed) {
            logger.error("Rate Limit Exceeded for Embedding API");
            throw new GendoxException("RATE_LIMIT_EXCEEDED", "Rate Limit Exceeded", HttpStatus.TOO_MANY_REQUESTS);
        }
        return bucket;
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

        var openAiGptRequest = OpenAiGptRequest.builder()
                .model(aiModel.getModel())
                .temperature(aiModelRequestParams.getTemperature())
                .topP(aiModelRequestParams.getTopP())
                .maxTokens(aiModelRequestParams.getMaxTokens())
                .messages(messages)
                .build();

        // handle o1 params
        if (aiModel.getModel().contains("o1")) {
            openAiGptRequest.setTopP(1);
            openAiGptRequest.setTemperature(1);
            openAiGptRequest.setMaxCompletionTokens(2 * openAiGptRequest.getMaxTokens());
            openAiGptRequest.setMaxTokens(null);
            messages.getFirst().setRole("user");

        }

        OpenAiGptResponse openAiGptResponse = this.getCompletionResponse(openAiGptRequest,
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
