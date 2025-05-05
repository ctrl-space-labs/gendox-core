package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;

import java.util.List;
import java.util.Set;

public interface AiModelApiAdapterService {


    EmbeddingResponse askEmbedding(EmbeddingMessage embeddingMessage, AiModel aiModel, String apiKey);
    CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, AiModel aiModel,
                                     AiModelRequestParams aiModelRequestParams, String apiKey);
    ModerationResponse askModeration(String message, String apiKey, AiModel aiModel);
    RerankResponse askRerank(List<String> documents, String query, AiModel aiModel, String apiKey);
    Set<String> getSupportedApiTypeNames();
    boolean supports(String apiTypeName);
}

