package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelRequestParams;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.EmbeddingMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.ModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.RerankResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Usage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.DecisionModelApiAdapter;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming.CompletionDelta;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import org.jetbrains.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;
import tools.jackson.databind.node.ObjectNode;

@Component
public class AiModelUtils {

    private static final Logger logger = LoggerFactory.getLogger(AiModelUtils.class);

    @Autowired
    private List<AiModelApiAdapterService> aiModelApiAdapterServices;

    @Autowired
    private List<DecisionModelApiAdapter> decisionModelApiAdapters;

    public AiModelApiAdapterService getAiModelApiAdapterImpl(String apiTypeName) throws GendoxException {
        for (AiModelApiAdapterService aiModelApiAdapterService : aiModelApiAdapterServices) {
            if (aiModelApiAdapterService.supports(apiTypeName)){
                return aiModelApiAdapterService;
            }
        }
        throw new GendoxException("MODEL_NOT_SUPPORTED", "Model not supported", HttpStatus.BAD_REQUEST);
    }

    public DecisionModelApiAdapter getDecisionModelApiAdapterImpl(String apiTypeName) throws GendoxException {
        for (DecisionModelApiAdapter adapter : decisionModelApiAdapters) {
            if (adapter.supports(apiTypeName)) {
                return adapter;
            }
        }
        throw new GendoxException("DECISION_MODEL_NOT_SUPPORTED", "Decision model not supported", HttpStatus.BAD_REQUEST);
    }

    /**
     * Every completion goes through here, whatever the provider: the request and the response are logged once,
     * streamed or not, and the adapters only talk to their provider. Embeddings, rerank and moderation the same.
     *
     * @param deltas receives the model's tokens as they arrive; null asks the provider for the whole response
     */
    public CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, AiModel aiModel,
                                            AiModelRequestParams params, String apiKey, List<AiTools> tools, String toolChoice,
                                            @Nullable ObjectNode responseJsonSchema,
                                            @Nullable Consumer<CompletionDelta> deltas) throws GendoxException {
        AiModelApiAdapterService adapter = getAiModelApiAdapterImpl(aiModel.getApiType().getName());
        logger.info("Sending completion request to {} at {}{}: {} message(s), {} tool(s)",
                aiModel.getModel(), aiModel.getUrl(), deltas == null ? "" : " (streaming)",
                messages.size(), tools == null ? 0 : tools.size());

        long start = System.currentTimeMillis();
        CompletionResponse response = adapter.askCompletion(messages, agentRole, aiModel, params, apiKey, tools, toolChoice, responseJsonSchema, deltas);

        Usage usage = response == null ? null : response.getUsage();
        if (usage == null) {
            logger.info("Received completion response from {} in {} ms", aiModel.getModel(), System.currentTimeMillis() - start);
        } else {
            logger.info("Received completion response from {} in {} ms. Input tokens: {} (cached {}), output tokens: {} (reasoning {})",
                    aiModel.getModel(), System.currentTimeMillis() - start,
                    usage.getPromptTokens(),
                    Optional.ofNullable(usage.getPromptTokensDetail()).map(Usage.PromptTokensDetail::getCachedTokens).orElse(0),
                    usage.getCompletionTokens(),
                    Optional.ofNullable(usage.getCompletionTokensDetail()).map(Usage.CompletionTokensDetails::getReasoningTokens).orElse(0));
        }
        return response;
    }

    public EmbeddingResponse askEmbedding(EmbeddingMessage message, AiModel aiModel, String apiKey) throws GendoxException {
        AiModelApiAdapterService adapter = getAiModelApiAdapterImpl(aiModel.getApiType().getName());
        logger.info("Sending embedding request to {} at {}: {} text(s)", aiModel.getModel(), aiModel.getUrl(),
                message.getMessages() == null ? 0 : message.getMessages().size());

        long start = System.currentTimeMillis();
        EmbeddingResponse response = adapter.askEmbedding(message, aiModel, apiKey);

        logger.info("Received embedding response from {} in {} ms. Tokens: {}", aiModel.getModel(), System.currentTimeMillis() - start,
                Optional.ofNullable(response).map(EmbeddingResponse::getUsage).map(Usage::getTotalTokens).orElse(null));
        return response;
    }

    public RerankResponse askRerank(List<String> documents, String query, AiModel aiModel, String apiKey) throws GendoxException {
        AiModelApiAdapterService adapter = getAiModelApiAdapterImpl(aiModel.getApiType().getName());
        logger.info("Sending rerank request to {} at {}: {} document(s)", aiModel.getModel(), aiModel.getUrl(), documents.size());

        long start = System.currentTimeMillis();
        RerankResponse response = adapter.askRerank(documents, query, aiModel, apiKey);

        logger.info("Received rerank response from {} in {} ms. Tokens: {}", aiModel.getModel(), System.currentTimeMillis() - start,
                Optional.ofNullable(response).map(RerankResponse::getTotal_tokens).orElse(null));
        return response;
    }

    public ModerationResponse askModeration(String message, String apiKey, AiModel aiModel) throws GendoxException {
        AiModelApiAdapterService adapter = getAiModelApiAdapterImpl(aiModel.getApiType().getName());
        logger.info("Sending moderation request to {} at {}", aiModel.getModel(), aiModel.getUrl());

        long start = System.currentTimeMillis();
        ModerationResponse response = adapter.askModeration(message, apiKey, aiModel);

        boolean flagged = response != null && response.getResults() != null
                && response.getResults().stream().anyMatch(ModerationResponse.Result::isFlagged);
        logger.info("Received moderation response from {} in {} ms. Flagged: {}", aiModel.getModel(), System.currentTimeMillis() - start, flagged);
        logger.debug("Moderation response: {}", response);
        return response;
    }
}
