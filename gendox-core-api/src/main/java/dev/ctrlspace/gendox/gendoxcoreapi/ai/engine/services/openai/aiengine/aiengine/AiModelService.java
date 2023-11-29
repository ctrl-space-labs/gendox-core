package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.BotRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.Gpt35Message;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Ada2Response;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Gpt35ModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Gpt35Response;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;

import java.util.List;
import java.util.UUID;

public interface AiModelService {
// will make it accept projectAgent later
    Ada2Response askEmbedding(BotRequest botRequest, String aiModelName);
//   I want to also add Long maxTokens, Float topP, Float temperature, aiModelId
    Gpt35Response askCompletion(List<Gpt35Message> messages, String agentRole, String aiModelName);

//    I want to add aiModelId
    Gpt35ModerationResponse moderationCheck(String message);
}
