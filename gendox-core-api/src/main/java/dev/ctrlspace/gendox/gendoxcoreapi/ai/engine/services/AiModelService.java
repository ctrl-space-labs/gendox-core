package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.*;

import java.util.List;

public interface AiModelService {


    EmbeddingResponse askEmbedding(BotRequest botRequest, String aiModelName);
    CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, String aiModelName,
                                     AiModelRequestParams aiModelRequestParams);


    OpenAiGpt35ModerationResponse moderationCheck(String message);

    boolean supports(String model);
}

