package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;

import java.util.List;

public interface AiModelTypeService {


    EmbeddingResponse askEmbedding(BotRequest botRequest, String aiModelName);
    CompletionResponse askCompletion(List<AiModelMessage> messages, String agentRole, String aiModelName,
                                     AiModelRequestParams aiModelRequestParams);

    /**
     * The name of the service provide the completions.
     * e.g. 'OpenAI', 'Cohere', 'Ollama' etc
     *
     * @return
     */
    String getServiceName();

    OpenAiGpt35ModerationResponse moderationCheck(String message);

    boolean supports(AiModel model);
}

