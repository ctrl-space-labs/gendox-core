package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.mistral.aiengine.aiengine;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters.MistralCompletionResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters.MistralEmbeddingResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters.MistralModerationResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.request.MistralCompletionRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.request.MistralEmbedRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.request.MistralModerationRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.response.MistralCompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.response.MistralEmbedResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.response.MistralModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.MistralConfig;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
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
public class MistralAiServiceAdapter implements AiModelApiAdapterService {
    Logger logger = LoggerFactory.getLogger(MistralAiServiceAdapter.class);
    private Set<String> supportedApiTypeNames = Set.of("MISTRAL_AI_API");
    private RestTemplate restTemplate;
    private MistralEmbeddingResponseConverter mistralEmbeddingResponseConverter;
    private MistralCompletionResponseConverter mistralCompletionResponseConverter;
    private MistralModerationResponseConverter mistralModerationResponseConverter;

    @Autowired
    public MistralAiServiceAdapter(RestTemplate restTemplate,
                                   MistralEmbeddingResponseConverter mistralEmbeddingResponseConverter,
                                   MistralCompletionResponseConverter mistralCompletionResponseConverter,
                                   MistralModerationResponseConverter mistralModerationResponseConverter) {
        this.restTemplate = restTemplate;
        this.mistralEmbeddingResponseConverter = mistralEmbeddingResponseConverter;
        this.mistralCompletionResponseConverter = mistralCompletionResponseConverter;
        this.mistralModerationResponseConverter = mistralModerationResponseConverter;
    }

    private HttpHeaders buildHeader(String apiKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(MistralConfig.MEDIA_TYPE));
        headers.add(MistralConfig.AUTHORIZATION, MistralConfig.BEARER + apiKey);
        return headers;
    }

    public MistralEmbedResponse getEmbeddingResponse(MistralEmbedRequest embeddingRequestHttpEntity, AiModel aiModel, String apiKey) {
        String embeddingsApiUrl = aiModel.getUrl();
        logger.debug("Sending Embedding Request to '{}': {}", embeddingsApiUrl, embeddingRequestHttpEntity);
        logger.info("AiModel for Embedding-->: {}", aiModel.getModel());
        ResponseEntity<MistralEmbedResponse> responseEntity = restTemplate.postForEntity(
                embeddingsApiUrl,
                new HttpEntity<>(embeddingRequestHttpEntity, buildHeader(apiKey)),
                MistralEmbedResponse.class);
        logger.info("Received Embedding Response from '{}'. Tokens billed: {}", embeddingsApiUrl,
                responseEntity.getBody().getUsage().getTotal_tokens());

        return responseEntity.getBody();
    }

    public MistralCompletionResponse getCompletionResponse(MistralCompletionRequest completionRequestHttpEntity, AiModel aiModel, String apiKey) {
        String completionsApiUrl = aiModel.getUrl();
        logger.debug("Sending Completion Request to '{}': {}", completionsApiUrl, completionRequestHttpEntity);
        logger.info("AiModel for Completion-->: {}", aiModel.getModel());
        ResponseEntity<MistralCompletionResponse> responseEntity = restTemplate.postForEntity(
                completionsApiUrl,
                new HttpEntity<>(completionRequestHttpEntity, buildHeader(apiKey)),
                MistralCompletionResponse.class);
        logger.info("Received Completion Response from '{}'. Tokens billed: {}", completionsApiUrl,
                responseEntity.getBody().getUsage().getTotal_tokens());

        return responseEntity.getBody();
    }

    public MistralModerationResponse getModerationResponse(MistralModerationRequest moderationRequest, AiModel aiModel, String apiKey) {
        String moderationApiUrl = aiModel.getUrl();
        logger.info("AiModel for Moderation: {}", aiModel.getModel());
        ResponseEntity<MistralModerationResponse> responseEntity = restTemplate.postForEntity(
                moderationApiUrl,
                new HttpEntity<>(moderationRequest, buildHeader(apiKey)),
                MistralModerationResponse.class);
        logger.debug("Received moderation Response from {}.", moderationApiUrl);

        return responseEntity.getBody();

    }


    @Override
    public EmbeddingResponse askEmbedding(EmbeddingMessage embeddingMessage, AiModel aiModel, String apiKey) {
        MistralEmbedResponse mistralEmbedResponse = this.getEmbeddingResponse((MistralEmbedRequest.builder()
                        .model(aiModel.getModel())
                        .input(embeddingMessage.getMessages())
                        .build()),
                aiModel,
                apiKey);

        EmbeddingResponse embeddingResponse = mistralEmbeddingResponseConverter.mistraltoEmbeddingResponse(mistralEmbedResponse);
        logger.info("Embedding Response: {}", embeddingResponse);
        return embeddingResponse;


    }

    @Override
    public CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, AiModel aiModel, AiModelRequestParams aiModelRequestParams, String apiKey, List<AiTools> tools) {
        if (Strings.isNotEmpty(agentRole)) {
            messages.add(0, AiModelMessage.builder().role("system").content(agentRole).build());
        }

        List<MistralCompletionRequest.MistralMessage> mistralMessages = messages.stream()
                .map(m -> MistralCompletionRequest.MistralMessage.builder()
                        .role(m.getRole())
                        .content(m.getContent())
                        .build())
                .toList();

        MistralCompletionRequest.MistralCompletionRequestBuilder completionRequestBuilder = MistralCompletionRequest.builder()
                .model(aiModel.getModel())
                .messages(mistralMessages);

        MistralCompletionRequest completionRequest = completionRequestBuilder.build();
        MistralCompletionResponse mistralCompletionResponse = this.getCompletionResponse(completionRequest, aiModel, apiKey);
        logger.info("Completion Response: {}", mistralCompletionResponse);
        CompletionResponse completionResponse = mistralCompletionResponseConverter.toCompletionResponse(mistralCompletionResponse);
        logger.info("Completion Response: {}", completionResponse);

        return completionResponse;
    }



    @Override
    public Set<String> getSupportedApiTypeNames() {
        return supportedApiTypeNames;
    }

    @Override
    public ModerationResponse askModeration(String message, String apiKey, AiModel aiModel) {
       MistralModerationResponse mistralModerationResponse = this.getModerationResponse(
                MistralModerationRequest.builder()
                        .model(aiModel.getModel())
                        .input(message)
                        .build(),
                aiModel,
               apiKey);

        ModerationResponse moderationResponse = mistralModerationResponseConverter.toModerationResponse(mistralModerationResponse);
        logger.info("Moderation Response: {}", moderationResponse);
        return moderationResponse;

    }

    @Override
    public RerankResponse askRerank(List<String> documents, String query, AiModel aiModel, String apiKey) {
        return null;
    }

    @Override
    public boolean supports(String apiTypeName) {
        return supportedApiTypeNames.contains(apiTypeName);
    }
}
