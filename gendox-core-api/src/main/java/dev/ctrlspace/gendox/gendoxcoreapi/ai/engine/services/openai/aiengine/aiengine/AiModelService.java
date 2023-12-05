package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.BotRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.AiMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.RequestParams;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.*;

import java.util.List;
import java.util.Set;

public interface AiModelService {
//    Ada2Response askEmbedding(BotRequest botRequest);
//
////    Gpt35Response askCompletion(List<Gpt35Message> messages, String agentRole, String aiModelName);
//    GptResponse askCompletionGpt(List<GptMessage> messages, String agentRole, String aiModelName, GptRequestParams gptRequestParams);
//
//
//    Gpt35ModerationResponse moderationCheck(String message);

    EmbeddingResponse askEmbedding(BotRequest botRequest);
    CompletionResponse askCompletion(List<AiMessage> messages, String agentRole, String aiModelName, RequestParams requestParams);

    ModerationResponse moderationCheck(String message);

    boolean supports(String model);
}

