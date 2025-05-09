package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.OpenAiCompletionRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiCompletionResponse;
import org.springframework.web.service.annotation.PostExchange;

public interface OpenAiClient {

    // TODO test this and replace AiModelServiceImpl restTemplate with this
    @PostExchange("/chat/completions")
    OpenAiCompletionResponse getGptResponse(OpenAiCompletionRequest chatRequestHttpEntity);

}
