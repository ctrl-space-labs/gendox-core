package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;

import java.util.List;
import java.util.Set;

public interface AiModelApiAdapterService {


    EmbeddingResponse askEmbedding(BotRequest botRequest, AiModel aiModel, String apiKey);
    CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, AiModel aiModel,
                                     AiModelRequestParams aiModelRequestParams, String apiKey);


    Set<String> getSupportedApiTypeNames();

    OpenAiModerationResponse moderationCheck(String message, String apiKey);

    boolean supports(String apiTypeName);
}

