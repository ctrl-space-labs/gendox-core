package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.knuddels.jtokkit.Encodings;
import com.knuddels.jtokkit.api.Encoding;
import com.knuddels.jtokkit.api.EncodingRegistry;
import com.knuddels.jtokkit.api.ModelType;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters.OpenAiModerationResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters.ToolDtoConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.OpenAIADA2;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters.OpenAiCompletionResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters.OpenAiEmbeddingResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ApiRateLimitService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.DurationUtils;
import io.github.bucket4j.Bucket;
import lombok.SneakyThrows;
import org.apache.logging.log4j.util.Strings;
import org.jetbrains.annotations.Nullable;
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

    private final ObjectMapper objectMapper;
    protected Set<String> supportedApiType = Set.of("OPEN_AI_API");
    protected Logger logger = LoggerFactory.getLogger(OpenAiServiceAdapter.class);
    private AiModelRepository aiModelRepository;
    private OpenAiCompletionResponseConverter openAiCompletionResponseConverter;
    private OpenAiEmbeddingResponseConverter openAiEmbeddingResponseConverter;
    private OpenAiModerationResponseConverter openAiModerationResponseConverter;
    private DurationUtils durationUtils;
    private ApiRateLimitService apiRateLimitService;

    private ToolDtoConverter toolDtoConverter;

    @Autowired
    public OpenAiServiceAdapter(AiModelRepository aiModelRepository,
                                ApiRateLimitService apiRateLimitService,
                                OpenAiCompletionResponseConverter openAiCompletionResponseConverter,
                                OpenAiEmbeddingResponseConverter openAiEmbeddingResponseConverter,
                                DurationUtils durationUtils,
                                OpenAiModerationResponseConverter openAiModerationResponseConverter,
                                ToolDtoConverter toolDtoConverter, ObjectMapper objectMapper) {
        this.aiModelRepository = aiModelRepository;
        this.apiRateLimitService = apiRateLimitService;
        this.openAiEmbeddingResponseConverter = openAiEmbeddingResponseConverter;
        this.openAiCompletionResponseConverter = openAiCompletionResponseConverter;
        this.durationUtils = durationUtils;
        this.openAiModerationResponseConverter = openAiModerationResponseConverter;
        this.toolDtoConverter = toolDtoConverter;
        this.objectMapper = objectMapper;
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

    public OpenAiEmbeddingResponse getEmbeddingResponse(OpenAiEmbedRequest embeddingRequestHttpEntity, AiModel aiModel, String apiKey) {
        String embeddingsApiUrl = aiModel.getUrl();

//        Bucket bucket = waitOpenAiRateLimit(embeddingRequestHttpEntity, apiKey);

        logger.trace("Sending Embedding Request to {}: {}", embeddingsApiUrl, embeddingRequestHttpEntity);
        logger.info("AiModel for Search -->: {}", aiModel.getModel());
        ResponseEntity<OpenAiEmbeddingResponse> responseEntity = restTemplate.postForEntity(
                embeddingsApiUrl,
                new HttpEntity<>(embeddingRequestHttpEntity, buildHeader(apiKey)),
                OpenAiEmbeddingResponse.class);

        // Extract rate limit headers
        HttpHeaders headers = responseEntity.getHeaders();
        RateLimitInfo rateLimitInfo = extractRateLimitHeaders(headers);


        OpenAiEmbeddingResponse openAiEmbeddingResponse = responseEntity.getBody();

        // for gemini embedding because it is free
        if (openAiEmbeddingResponse.getUsage() == null) {
            Usage freeUsage = Usage.builder()
                    .promptTokens(0)
                    .completionTokens(0)
                    .totalTokens(0)
                    .build();
            openAiEmbeddingResponse.setUsage(freeUsage);
        }

        logger.info("Received Embedding Response from {}. Tokens billed: {}", embeddingsApiUrl, openAiEmbeddingResponse.getUsage().getTotalTokens());

        openAiEmbeddingResponse.setTotalRateLimitRequests(rateLimitInfo.getTotalRateLimitRequests());
        openAiEmbeddingResponse.setTotalRateLimitTokens(rateLimitInfo.getTotalRateLimitTokens());
        openAiEmbeddingResponse.setRateLimitRemainingRequests(rateLimitInfo.getRateLimitRemainingRequests());
        openAiEmbeddingResponse.setRateLimitRemainingTokens(rateLimitInfo.getRateLimitRemainingTokens());
        openAiEmbeddingResponse.setRateLimitResetRequestsMilliseconds(rateLimitInfo.getRateLimitResetRequestsMilliseconds());
        openAiEmbeddingResponse.setRateLimitResetTokensMilliseconds(rateLimitInfo.getRateLimitResetTokensMilliseconds());

        // TODO update rate limit bucket
        // For now just sleep for a small amount of time when we are near the API limits

        sleepIfLowRateLimit(openAiEmbeddingResponse);


        return openAiEmbeddingResponse;
    }

    /**
     * @param openAiEmbeddingResponse
     */
    private void sleepIfLowRateLimit(OpenAiEmbeddingResponse openAiEmbeddingResponse) {
        // Check if remaining requests or tokens are less than 10% of the total
        boolean isLowOnRequests = openAiEmbeddingResponse.getRateLimitRemainingRequests() != null &&
                openAiEmbeddingResponse.getRateLimitRemainingRequests() < 0.1 * openAiEmbeddingResponse.getTotalRateLimitRequests();
        boolean isLowOnTokens = openAiEmbeddingResponse.getRateLimitRemainingTokens() != null &&
                openAiEmbeddingResponse.getRateLimitRemainingTokens() < 0.1 * openAiEmbeddingResponse.getTotalRateLimitTokens();

        if (isLowOnRequests || isLowOnTokens) {
            // Get the reset times in milliseconds
            long resetRequestsMillis = openAiEmbeddingResponse.getRateLimitResetRequestsMilliseconds();
            long resetTokensMillis = openAiEmbeddingResponse.getRateLimitResetTokensMilliseconds();

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
    private Bucket waitOpenAiRateLimit(OpenAiEmbedRequest embeddingRequestHttpEntity, String apiKey) throws GendoxException {
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


    public OpenAiCompletionResponse getCompletionResponse(OpenAiCompletionRequest chatRequestHttpEntity, AiModel aiModel, String apiKey) {
        String completionApiUrl = aiModel.getUrl();
        logger.trace("Sending completion Request to {}: {}", completionApiUrl, chatRequestHttpEntity);
        logger.info("AiModel for Completion: {}", aiModel.getModel());
        ResponseEntity<OpenAiCompletionResponse> responseEntity = restTemplate.postForEntity(
                completionApiUrl,
                new HttpEntity<>(chatRequestHttpEntity, buildHeader(apiKey)),
                OpenAiCompletionResponse.class);
        logger.debug("Received completion Response from {}. Prompt Tokens billed: {}, Cached Tokens billed: {}, Completion Tokens billed: {}, total tokens: {}",
                completionApiUrl,
                responseEntity.getBody().getUsage().getPromptTokens(),
                Optional.ofNullable(responseEntity.getBody())
                        .map(b -> b.getUsage())
                        .map(u -> u.getPromptTokensDetail())
                        .map(d -> d.getCachedTokens())
                        .orElse(0),
                responseEntity.getBody().getUsage().getCompletionTokens(),
                responseEntity.getBody().getUsage().getTotalTokens());

        return responseEntity.getBody();
    }

    public OpenAiModerationResponse getModerationResponse(OpenAiModerationRequest moderationRequest, String apiKey, AiModel aiModel) {
        String moderationApiUrl = aiModel.getUrl();
        logger.info("AiModel for Moderation: {}", aiModel.getModel());
        ResponseEntity<OpenAiModerationResponse> responseEntity = restTemplate.postForEntity(
                moderationApiUrl,
                new HttpEntity<>(moderationRequest, buildHeader(apiKey)),
                OpenAiModerationResponse.class);
        logger.debug("Received moderation Response from {}.", moderationApiUrl);

        return responseEntity.getBody();
    }


    public EmbeddingResponse askEmbedding(EmbeddingMessage embeddingMessage, AiModel aiModel, String apiKey) {
        String message = embeddingMessage.getMessages().get(0);
        OpenAiEmbeddingResponse openAiEmbeddingResponse = this.getEmbeddingResponse((OpenAiEmbedRequest.builder()
                        .model(aiModel.getModel())
                        .input(message).build()),
                aiModel,
                apiKey);

        EmbeddingResponse embeddingResponse = openAiEmbeddingResponseConverter.openAitoEmbeddingResponse(openAiEmbeddingResponse);

        return embeddingResponse;

    }

    @SneakyThrows
    @Override
    public CompletionResponse askCompletion(List<AiModelMessage> messages,
                                            String agentRole, AiModel aiModel,
                                            AiModelRequestParams aiModelRequestParams,
                                            String apiKey,
                                            List<AiTools> tools,
                                            String toolChoice,
                                            @Nullable ObjectNode responseJsonSchema) {
        if (Strings.isNotEmpty(agentRole)) {
            upsertSystemPrompt(messages, agentRole);
        }


        OpenAiCompletionRequest.OpenAiCompletionRequestBuilder openAiGptRequestBuilder = OpenAiCompletionRequest.builder()
                .model(aiModel.getModel())
                .messages(messages);

        if (!tools.isEmpty()) {
            List<OpenAiCompletionRequest.ToolDto> toolsDtos = tools.stream()
                    .map(tool -> toolDtoConverter.toToolDto(tool))
                    .toList();

            openAiGptRequestBuilder
                    .toolChoice(toolChoice == null ? "auto" : toolChoice) // Default to "auto" if toolChoice is null
                    .tools(toolsDtos);

        }

        if (responseJsonSchema != null) {
            openAiGptRequestBuilder
                    .responseFormat(OpenAiCompletionRequest.ResponseFormat.builder()
                            .type("json_schema")
                            .jsonSchema(responseJsonSchema)
                            .build());

        }


        openAiGptRequestBuilder
                .temperature(aiModelRequestParams.getTemperature())
                .topP(aiModelRequestParams.getTopP())
                .maxTokens(aiModelRequestParams.getMaxTokens());

        // Special case for preview search models
        if (aiModel.getModel().toLowerCase().contains("search-preview")) {
            // Only model and messages are set, no temperature, top_p, max_tokens
            logger.info("Detected Preview Search Model: Only setting model and messages for {}", aiModel.getModel());
            openAiGptRequestBuilder
                    .temperature(null)
                    .topP(null)
                    .maxTokens(null)
                    .maxCompletionTokens(null);
        }
        // Special case for o1, o3, o4 models, temprature to 1
        if (List.of("o1", "o3", "o4", "gpt-5-", "gpt-5.1").stream()
                .anyMatch(aiModel.getModel()::contains)) {
            openAiGptRequestBuilder
                    .temperature(1.0)
                    .topP(1.0);
            // Make first message "user"
            messages.getFirst().setRole("developer");
        }

        // thinking models, increate max tokens and set reasoning effort
        if (List.of("o1", "o3", "o4", "gpt-5-", "gpt-5.1", "gemini-2.5", "gemini-3").stream()
                .anyMatch(aiModel.getModel()::contains)) {
            openAiGptRequestBuilder
                    .reasoningEffort(computeReasoningEffort(aiModelRequestParams.getMaxTokens(), aiModel.getModel()))
                    .maxCompletionTokens(2 * aiModelRequestParams.getMaxTokens())
                    .maxTokens(null);

            // Make first message "user"
            messages.getFirst().setRole("developer");
        }

        OpenAiCompletionRequest openAiCompletionRequest = openAiGptRequestBuilder.build();
        OpenAiCompletionResponse openAiCompletionResponse = this.getCompletionResponse(openAiCompletionRequest, aiModel, apiKey);
        CompletionResponse completionResponse = openAiCompletionResponseConverter.toCompletionResponse(openAiCompletionResponse);

        return completionResponse;
    }

    private static void upsertSystemPrompt(List<AiModelMessage> messages, String agentRole) {
        AiModelMessage first = messages.isEmpty() ? null : messages.getFirst();

        boolean hasSpecialRole = first != null &&
                ("system".equals(first.getRole()) || "developer".equals(first.getRole()));

        String role = hasSpecialRole ? first.getRole() : "system";

        AiModelMessage updated = AiModelMessage.builder()
                .role(role)
                .content(agentRole)
                .build();

        if (hasSpecialRole) {
            messages.set(0, updated);
        } else {
            messages.add(0, updated);
        }
    }

    // TODO Change this. The reasoning budget should be stored as an extra property n the Agent
    private static String computeReasoningEffort(Long maxTokens, String modelName) {
        long tokens = maxTokens == null ? 0L : maxTokens;
        String name = modelName == null ? "" : modelName.toLowerCase(Locale.ROOT);

        boolean isGpt51       = name.startsWith("gpt-5.1");
        boolean isGpt5        = name.startsWith("gpt-5") && !isGpt51;
        boolean isGemini25Pro = name.contains("gemini-2.5-pro");

        if (tokens >= 32_768L) return "high";
        if (tokens >= 8_192L)  return "medium";
        if (tokens >= 1_024L)  return "low";

        if (isGpt5)        return "minimal"; // GPT-5 min is "minimal"
        if (isGemini25Pro) return "low";     // Gemini 2.5 Pro: no "none", min "low"

        // GPT-5.1 and others (that support it) can get "none"
        return "none";
    }


    @Override
    public ModerationResponse askModeration(String message, String apiKey, AiModel aiModel) {
        OpenAiModerationResponse openAiModerationResponse = this.getModerationResponse(OpenAiModerationRequest.builder()
                        .model(aiModel.getModel())
                        .input(message)
                        .build(),
                apiKey,
                aiModel);

        ModerationResponse moderationResponse = openAiModerationResponseConverter.toModerationResponse(openAiModerationResponse);
        logger.info("Moderation Response: {}", moderationResponse);
        return moderationResponse;
    }

    @Override
    public RerankResponse askRerank(List<String> documents, String query, AiModel aiModel, String apiKey) {
        return null;
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
