package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.BotRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.AiModelRequestParams;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.*;

import java.util.List;

public interface AiModelService {
//    Ada2Response askEmbedding(BotRequest botRequest);
//
////    Gpt35Response askCompletion(List<Gpt35Message> messages, String agentRole, String aiModelName);
//    GptResponse askCompletionGpt(List<GptMessage> messages, String agentRole, String aiModelName, GptRequestParams gptRequestParams);
//
//
//    Gpt35ModerationResponse moderationCheck(String message);

    EmbeddingResponse askEmbedding(BotRequest botRequest, String aiModelName);
    CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, String aiModelName, AiModelRequestParams aiModelRequestParams);

//    ModerationResponse moderationCheck(String message);

    OpenAiGpt35ModerationResponse moderationCheck(String message);


    boolean supports(String model);
}

