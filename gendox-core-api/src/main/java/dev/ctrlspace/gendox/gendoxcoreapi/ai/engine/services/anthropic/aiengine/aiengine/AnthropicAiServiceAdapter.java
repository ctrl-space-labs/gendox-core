package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.anthropic.aiengine.aiengine;

import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters.AnthropicCompletionResponseConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters.AnthropicMessagesConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.anthropic.request.AnthropicCompletionRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.anthropic.response.AnthropicCompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.AnthropicConfig;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import org.apache.logging.log4j.util.Strings;
import org.jetbrains.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
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
    private AnthropicMessagesConverter anthropicMessagesConverter;

    @Autowired
    public AnthropicAiServiceAdapter(RestTemplate restTemplate,
                                     AnthropicCompletionResponseConverter anthropicCompletionResponseConverter,
                                     AnthropicMessagesConverter anthropicMessagesConverter) {
        this.restTemplate = restTemplate;
        this.anthropicCompletionResponseConverter = anthropicCompletionResponseConverter;
        this.anthropicMessagesConverter = anthropicMessagesConverter;
    }


    private HttpHeaders buildHeader(String apiKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add(AnthropicConfig.API_KEY_HEADER, apiKey);
        headers.add(AnthropicConfig.VERSION_HEADER, AnthropicConfig.VERSION);
        return headers;
    }


    public AnthropicCompletionResponse getCompletionResponse(AnthropicCompletionRequest anthropicRequest, AiModel aiModel, String apiKey) {
        String completionApiUrl = aiModel.getUrl();
        logger.trace("Sending completion Request to '{}': {}", completionApiUrl, anthropicRequest);
        logger.info("AiModel for Completion: {}", aiModel.getModel());
        ResponseEntity<AnthropicCompletionResponse> responseEntity = restTemplate.postForEntity(
                completionApiUrl,
                new HttpEntity<>(anthropicRequest, buildHeader(apiKey)),
                AnthropicCompletionResponse.class);
        AnthropicCompletionResponse body = responseEntity.getBody();
        if (body != null && body.getUsage() != null) {
            logger.info("Received completion Response from '{}'. Tokens billed: {}", completionApiUrl,
                    body.getUsage().getInput_tokens() + body.getUsage().getOutput_tokens());
        } else {
            logger.info("Received completion Response from '{}'.", completionApiUrl);
        }

        return body;

    }


    @Override
    public EmbeddingResponse askEmbedding(EmbeddingMessage embeddingMessage, AiModel aiModel, String apiKey) {
        return null;
    }

    @Override
    public CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, AiModel aiModel, AiModelRequestParams aiModelRequestParams, String apiKey, List<AiTools> tools, String toolChoice, @Nullable ObjectNode responseJsonSchema) {
        if (Strings.isNotEmpty(agentRole)) {
            messages.add(0, AiModelMessage.builder().role("user").content(agentRole).build());
        }
        if (responseJsonSchema != null) {
            logger.debug("responseJsonSchema is set but Anthropic completion does not support OpenAI response_format; ignoring.");
        }

        AnthropicMessagesConverter.MappedAnthropicMessages mapped = anthropicMessagesConverter.mapMessages(messages);

        AnthropicCompletionRequest.AnthropicCompletionRequestBuilder anthropicRequestBuilder = AnthropicCompletionRequest.builder()
                .model(aiModel.getModel())
                .messages(mapped.messages())
                .max_tokens(aiModelRequestParams.getMaxTokens().intValue());

        if (mapped.system() != null && !mapped.system().isEmpty()) {
            anthropicRequestBuilder.system(mapped.system());
        }
        // Anthropic rejects requests that set both temperature and top_p for some models.
        Double temperature = aiModelRequestParams.getTemperature();
        Double topP = aiModelRequestParams.getTopP();
        if (temperature != null) {
            anthropicRequestBuilder.temperature(temperature);
        } else if (topP != null) {
            anthropicRequestBuilder.topP(topP);
        }
        if (tools != null && !tools.isEmpty()) {
            anthropicRequestBuilder.tools(tools.stream()
                    .map(anthropicMessagesConverter::toAnthropicToolDefinition)
                    .toList());
            anthropicRequestBuilder.toolChoice(anthropicMessagesConverter.mapToolChoice(toolChoice));
        }

        AnthropicCompletionRequest anthropicRequest = anthropicRequestBuilder.build();
        AnthropicCompletionResponse anthropicResponse = this.getCompletionResponse(anthropicRequest, aiModel, apiKey);

        return anthropicCompletionResponseConverter.toCompletionResponse(anthropicResponse);
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
