package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.mistral.aiengine.aiengine;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters.MistralCompletionResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters.MistralEmbeddingResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.request.MistralCompletionRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.request.MistralEmbedRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.response.MistralCompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.response.MistralEmbedResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.cohere.aiengine.aiengine.CohereAiServiceAdapter;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.MistralConfig;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
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
    @Value("${gendox.models.mistral.key}")
    private String mistralKey;

    @Autowired
    public MistralAiServiceAdapter(RestTemplate restTemplate,
                                   MistralEmbeddingResponseConverter mistralEmbeddingResponseConverter,
                                   MistralCompletionResponseConverter mistralCompletionResponseConverter) {
        this.restTemplate = restTemplate;
        this.mistralEmbeddingResponseConverter = mistralEmbeddingResponseConverter;
        this.mistralCompletionResponseConverter = mistralCompletionResponseConverter;
    }

    private HttpHeaders buildHeader() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(MistralConfig.MEDIA_TYPE));
        headers.add(MistralConfig.AUTHORIZATION, MistralConfig.BEARER + mistralKey);
        return headers;
    }

    public MistralEmbedResponse getEmbeddingResponse(MistralEmbedRequest embeddingRequestHttpEntity, AiModel aiModel) {
        String embeddingsApiUrl = aiModel.getUrl();
        logger.debug("Sending Embedding Request to '{}': {}", embeddingsApiUrl, embeddingRequestHttpEntity);
        logger.info("AiModel for Embedding-->: {}", aiModel.getModel());
        ResponseEntity<MistralEmbedResponse> responseEntity = restTemplate.postForEntity(
                embeddingsApiUrl,
                new HttpEntity<>(embeddingRequestHttpEntity, buildHeader()),
                MistralEmbedResponse.class);
        logger.info("Received Embedding Response from '{}'. Tokens billed: {}", embeddingsApiUrl,
                responseEntity.getBody().getUsage().getTotal_tokens());

        return responseEntity.getBody();
    }

    public MistralCompletionResponse getCompletionResponse(MistralCompletionRequest completionRequestHttpEntity, AiModel aiModel) {
        String completionsApiUrl = aiModel.getUrl();
        logger.debug("Sending Completion Request to '{}': {}", completionsApiUrl, completionRequestHttpEntity);
        logger.info("AiModel for Completion-->: {}", aiModel.getModel());
        ResponseEntity<MistralCompletionResponse> responseEntity = restTemplate.postForEntity(
                completionsApiUrl,
                new HttpEntity<>(completionRequestHttpEntity, buildHeader()),
                MistralCompletionResponse.class);
        logger.info("Received Completion Response from '{}'. Tokens billed: {}", completionsApiUrl,
                responseEntity.getBody().getUsage().getTotal_tokens());

        return responseEntity.getBody();
    }


    @Override
    public EmbeddingResponse askEmbedding(BotRequest botRequest, AiModel aiModel, String apiKey) {
        MistralEmbedResponse mistralEmbedResponse = this.getEmbeddingResponse((MistralEmbedRequest.builder()
                        .model(aiModel.getModel())
                        .input(botRequest.getMessages())
                        .build()),
                aiModel);

        EmbeddingResponse embeddingResponse = mistralEmbeddingResponseConverter.mistraltoEmbeddingResponse(mistralEmbedResponse);
        logger.info("Embedding Response: {}", embeddingResponse);
        return embeddingResponse;


    }

    @Override
    public CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, AiModel aiModel, AiModelRequestParams aiModelRequestParams, String apiKey) {
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
        MistralCompletionResponse mistralCompletionResponse = this.getCompletionResponse(completionRequest, aiModel);
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
    public ModerationResponse moderationCheck(String message, String apiKey, AiModel aiModel) {
        return null;
    }

    @Override
    public boolean supports(String apiTypeName) {
        return supportedApiTypeNames.contains(apiTypeName);
    }
}
