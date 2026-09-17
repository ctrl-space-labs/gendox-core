package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine;

import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters.OpenAiResponsesConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.OpenAiResponsesItem;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.OpenAiResponsesRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiResponsesResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils.constants.OpenAIADA2;
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

/**
 * OpenAI Responses API.
 * Embedding/moderation/rerank stay on OPEN_AI_API, which is why they are unimplemented here.
 */
@Service
public class OpenAiResponsesServiceAdapter implements AiModelApiAdapterService {

    private static final Set<String> SUPPORTED_API_TYPES = Set.of("OPEN_AI_RESPONSES_API");

    /** Without this, encrypted_content is withheld and reasoning cannot be replayed. */
    private static final List<String> INCLUDE_ENCRYPTED_REASONING = List.of("reasoning.encrypted_content");

    private final Logger logger = LoggerFactory.getLogger(OpenAiResponsesServiceAdapter.class);

    private final RestTemplate restTemplate;
    private final OpenAiResponsesConverter responsesConverter;

    @Autowired
    public OpenAiResponsesServiceAdapter(RestTemplate restTemplate,
                                         OpenAiResponsesConverter responsesConverter) {
        this.restTemplate = restTemplate;
        this.responsesConverter = responsesConverter;
    }

    private HttpHeaders buildHeader(String apiKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(OpenAIADA2.MEDIA_TYPE));
        headers.add(OpenAIADA2.AUTHORIZATION, OpenAIADA2.BEARER + apiKey);
        return headers;
    }

    @Override
    public CompletionResponse askCompletion(List<AiModelMessage> messages,
                                            String agentRole,
                                            AiModel aiModel,
                                            AiModelRequestParams aiModelRequestParams,
                                            String apiKey,
                                            List<AiTools> tools,
                                            String toolChoice,
                                            @Nullable ObjectNode responseJsonSchema) {

        List<OpenAiResponsesItem> input = responsesConverter.toInputItems(messages, aiModel.getId());

        OpenAiResponsesRequest.OpenAiResponsesRequestBuilder requestBuilder = OpenAiResponsesRequest.builder()
                .model(aiModel.getModel())
                .input(input)
                .store(Boolean.FALSE)
                .include(INCLUDE_ENCRYPTED_REASONING);

        String instructions = resolveInstructions(messages, agentRole);
        if (Strings.isNotEmpty(instructions)) {
            requestBuilder.instructions(instructions);
        }

        applySamplingParams(requestBuilder, aiModel, aiModelRequestParams);

        if (aiModel.getSupportsReasoning()) {
            String effort = aiModelRequestParams.getReasoningEffort() != null
                    ? aiModelRequestParams.getReasoningEffort()
                    : aiModel.getDefaultReasoningEffort();

            // Tools and reasoning coexist here, so the effort is never downgraded.
            requestBuilder.reasoning(OpenAiResponsesRequest.Reasoning.builder()
                    .effort(effort)
                    .summary("auto")
                    .build());
        }

        if (tools != null && !tools.isEmpty()) {
            requestBuilder.tools(tools.stream().map(responsesConverter::toToolDto).toList())
                    .toolChoice(toolChoice == null ? "auto" : toolChoice);
        }

        if (responseJsonSchema != null) {
            requestBuilder.text(toTextConfig(responseJsonSchema));
        }

        OpenAiResponsesResponse response = getResponse(requestBuilder.build(), aiModel, apiKey);
        return responsesConverter.toCompletionResponse(response);
    }

    private OpenAiResponsesResponse getResponse(OpenAiResponsesRequest request, AiModel aiModel, String apiKey) {
        String url = aiModel.getUrl();
        logger.trace("Sending Responses request to {}: {}", url, request);
        logger.info("AiModel for Completion (Responses API): {}", aiModel.getModel());

        ResponseEntity<OpenAiResponsesResponse> responseEntity = restTemplate.postForEntity(
                url,
                new HttpEntity<>(request, buildHeader(apiKey)),
                OpenAiResponsesResponse.class);

        OpenAiResponsesResponse body = responseEntity.getBody();

        if (body != null && body.getUsage() != null) {
            logger.debug("Received Responses reply from {}. Input tokens: {}, Output tokens: {}, Reasoning tokens: {}, Total: {}",
                    url,
                    body.getUsage().getInputTokens(),
                    body.getUsage().getOutputTokens(),
                    body.getUsage().getOutputTokensDetails() == null
                            ? 0 : body.getUsage().getOutputTokensDetails().getReasoningTokens(),
                    body.getUsage().getTotalTokens());
        }

        // "incomplete" is a truncated answer, not an error; it would otherwise pass silently.
        if (body != null && "incomplete".equals(body.getStatus())) {
            logger.warn("Responses reply for {} was incomplete: {}", aiModel.getModel(), body.getIncompleteDetails());
        }

        return body;
    }

    /** Agent prompt wins, else a leading system message, matching the Chat Completions adapter. */
    private static String resolveInstructions(List<AiModelMessage> messages, String agentRole) {
        if (Strings.isNotEmpty(agentRole)) {
            return agentRole;
        }
        if (messages.isEmpty()) {
            return null;
        }
        AiModelMessage first = messages.getFirst();
        boolean isSystem = "system".equals(first.getRole()) || "developer".equals(first.getRole());
        return isSystem ? first.getContent() : null;
    }

    private static void applySamplingParams(OpenAiResponsesRequest.OpenAiResponsesRequestBuilder builder,
                                            AiModel aiModel,
                                            AiModelRequestParams params) {
        // Only the sampling params are dropped - the Responses API still wants
        // max_output_tokens. gpt-5.x reasoning models reject temperature and top_p outright.
        if (aiModel.getSupportsSamplingParams()) {
            builder.temperature(params.getTemperature())
                    .topP(params.getTopP());
        }

        Long maxTokens = params.getMaxTokens();
        // Covers reasoning as well as the answer, so double it as the other adapter does.
        builder.maxOutputTokens(maxTokens == null ? null
                : (aiModel.getSupportsReasoning() ? 2 * maxTokens : maxTokens));
    }

    /** Responses hoists the schema name; we accept the Chat Completions wrapper either way. */
    private static OpenAiResponsesRequest.TextConfig toTextConfig(ObjectNode responseJsonSchema) {
        ObjectNode schemaNode = responseJsonSchema;
        String name = "response";

        if (responseJsonSchema.has("name") && responseJsonSchema.get("name").isTextual()) {
            name = responseJsonSchema.get("name").asText();
        }
        if (responseJsonSchema.has("schema") && responseJsonSchema.get("schema").isObject()) {
            schemaNode = (ObjectNode) responseJsonSchema.get("schema");
        }

        return OpenAiResponsesRequest.TextConfig.builder()
                .format(OpenAiResponsesRequest.Format.builder()
                        .type("json_schema")
                        .name(name)
                        .schema(schemaNode)
                        .build())
                .build();
    }

    @Override
    public EmbeddingResponse askEmbedding(EmbeddingMessage embeddingMessage, AiModel aiModel, String apiKey) {
        return null;
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
        return getSupportedApiTypeNames().contains(apiTypeName);
    }

    @Override
    public Set<String> getSupportedApiTypeNames() {
        return SUPPORTED_API_TYPES;
    }
}
