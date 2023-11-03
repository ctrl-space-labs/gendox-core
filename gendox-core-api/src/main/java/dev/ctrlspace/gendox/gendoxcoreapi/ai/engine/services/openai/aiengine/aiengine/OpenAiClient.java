package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.Gpt35Request;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Gpt35Response;
import org.springframework.web.service.annotation.PostExchange;

public interface OpenAiClient {

    // TODO test this and replace AiModelServiceImpl restTemplate with this
    @PostExchange("/chat/completions")
    Gpt35Response getGpt35Response(Gpt35Request chatRequestHttpEntity);

}
