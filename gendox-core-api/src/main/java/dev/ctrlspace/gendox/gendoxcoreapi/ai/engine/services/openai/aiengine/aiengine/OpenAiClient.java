package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.OpenAiGptRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiGptResponse;
import org.springframework.web.service.annotation.PostExchange;

public interface OpenAiClient {

    // TODO test this and replace AiModelServiceImpl restTemplate with this
    @PostExchange("/chat/completions")
    OpenAiGptResponse getGptResponse(OpenAiGptRequest chatRequestHttpEntity);

}
