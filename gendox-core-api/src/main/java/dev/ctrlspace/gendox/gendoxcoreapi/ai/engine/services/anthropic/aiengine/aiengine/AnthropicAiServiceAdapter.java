package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.anthropic.aiengine.aiengine;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters.AnthropicCompletionResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.anthropic.request.AnthropicCompletionRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.anthropic.response.AnthropicCompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.AnthropicConfig;
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
public class AnthropicAiServiceAdapter implements AiModelApiAdapterService {
    Logger logger = LoggerFactory.getLogger(AnthropicAiServiceAdapter.class);
    private Set<String> supportedApiTypeNames = Set.of("ANTHROPIC_AI_API");
    private RestTemplate restTemplate;
    private AnthropicCompletionResponseConverter anthropicCompletionResponseConverter;
    @Value("${gendox.models.anthropic.key}")
    private String anthropicKey;

    @Autowired
    public AnthropicAiServiceAdapter(RestTemplate restTemplate,
                                     AnthropicCompletionResponseConverter anthropicCompletionResponseConverter) {
        this.restTemplate = restTemplate;
        this.anthropicCompletionResponseConverter = anthropicCompletionResponseConverter;
    }


    private HttpHeaders buildHeader() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add(AnthropicConfig.API_KEY_HEADER, anthropicKey);
        headers.add(AnthropicConfig.VERSION_HEADER, AnthropicConfig.VERSION);
        return headers;
    }


    public AnthropicCompletionResponse getCompletionResponse(AnthropicCompletionRequest anthropicRequest, AiModel aiModel) {
        String completionApiUrl = aiModel.getUrl();
        logger.debug("Sending completion Request to '{}': {}", completionApiUrl, anthropicRequest);
        logger.info("AiModel for Completion: {}", aiModel.getModel());
        ResponseEntity<AnthropicCompletionResponse> responseEntity = restTemplate.postForEntity(
                completionApiUrl,
                new HttpEntity<>(anthropicRequest, buildHeader()),
                AnthropicCompletionResponse.class);
        logger.info("Received completion Response from '{}'. Tokens billed: {}", completionApiUrl,
                responseEntity.getBody().getUsage().getInput_tokens() + responseEntity.getBody().getUsage().getOutput_tokens());

        return responseEntity.getBody();

    }


    @Override
    public EmbeddingResponse askEmbedding(EmbeddingMessage embeddingMessage, AiModel aiModel, String apiKey) {
        return null;
    }

    @Override
    public CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, AiModel aiModel, AiModelRequestParams aiModelRequestParams, String apiKey, List<AiTools> tools) {
        if (Strings.isNotEmpty(agentRole)) {
            messages.add(0, AiModelMessage.builder().role("user").content(agentRole).build());
        }
        AnthropicCompletionRequest.AnthropicCompletionRequestBuilder anthropicRequestBuilder = AnthropicCompletionRequest.builder()
                .model(aiModel.getModel())
                .messages(
                        messages.stream()
                                .map(m -> AnthropicCompletionRequest.Message.builder()
                                        .role(m.getRole())
                                        .content(m.getContent())
                                        .build())
                                .toList())
                .max_tokens(aiModelRequestParams.getMaxTokens().intValue());

        AnthropicCompletionRequest anthropicRequest = anthropicRequestBuilder.build();
        AnthropicCompletionResponse anthropicResponse = this.getCompletionResponse(anthropicRequest, aiModel);


        CompletionResponse completionResponse = anthropicCompletionResponseConverter.toCompletionResponse(anthropicResponse);
        return completionResponse;
    }

    @Override
    public Set<String> getSupportedApiTypeNames() {
        return supportedApiTypeNames;
    }

    @Override
    public ModerationResponse askModeration(String message, String apiKey, AiModel aiModel) {
        return null;
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
