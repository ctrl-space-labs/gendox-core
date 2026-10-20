package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services;

import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming.CompletionDelta;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import org.jetbrains.annotations.Nullable;

import java.util.List;
import java.util.Set;
import java.util.function.Consumer;

public interface AiModelApiAdapterService {


    EmbeddingResponse askEmbedding(EmbeddingMessage embeddingMessage, AiModel aiModel, String apiKey);
    CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, AiModel aiModel,
                                     AiModelRequestParams aiModelRequestParams, String apiKey, List<AiTools> tools, String toolChoice,
                                     @Nullable ObjectNode responseJsonSchema);

    /**
     * The same completion, streamed: {@code deltas} receives the text and reasoning as they arrive, and
     * the whole response is returned as usual. Adapters that cannot stream send an ordinary request.
     */
    default CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, AiModel aiModel,
                                             AiModelRequestParams aiModelRequestParams, String apiKey, List<AiTools> tools, String toolChoice,
                                             @Nullable ObjectNode responseJsonSchema,
                                             @Nullable Consumer<CompletionDelta> deltas) {
        return askCompletion(messages, agentRole, aiModel, aiModelRequestParams, apiKey, tools, toolChoice, responseJsonSchema);
    }

    ModerationResponse askModeration(String message, String apiKey, AiModel aiModel);
    RerankResponse askRerank(List<String> documents, String query, AiModel aiModel, String apiKey);
    Set<String> getSupportedApiTypeNames();
    boolean supports(String apiTypeName);
}

