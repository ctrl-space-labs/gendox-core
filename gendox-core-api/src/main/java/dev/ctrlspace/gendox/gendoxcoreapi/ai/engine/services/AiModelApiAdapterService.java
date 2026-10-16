package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming.CompletionDelta;
import java.util.function.Consumer;

import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import org.jetbrains.annotations.Nullable;

import java.util.List;
import java.util.Set;

public interface AiModelApiAdapterService {


    EmbeddingResponse askEmbedding(EmbeddingMessage embeddingMessage, AiModel aiModel, String apiKey);
    CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, AiModel aiModel,
                                     AiModelRequestParams aiModelRequestParams, String apiKey, List<AiTools> tools, String toolChoice,
                                     @Nullable ObjectNode responseJsonSchema);

    default CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, AiModel aiModel,
            AiModelRequestParams params, String apiKey, List<AiTools> tools, String toolChoice,
            @Nullable ObjectNode schema, Consumer<CompletionDelta> listener) {
        return askCompletion(messages, agentRole, aiModel, params, apiKey, tools, toolChoice, schema);
    }

    ModerationResponse askModeration(String message, String apiKey, AiModel aiModel);
    RerankResponse askRerank(List<String> documents, String query, AiModel aiModel, String apiKey);
    Set<String> getSupportedApiTypeNames();
    boolean supports(String apiTypeName);
}

