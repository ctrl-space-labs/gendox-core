package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiCompletionResponse;
import org.springframework.stereotype.Component;


@Component
public class OpenAiCompletionResponseConverter {

    public CompletionResponse toCompletionResponse(OpenAiCompletionResponse openAiCompletionResponse) {
        CompletionResponse completionResponse = CompletionResponse.builder()
                .id(openAiCompletionResponse.getId())
                .object(openAiCompletionResponse.getObject())
                .created(openAiCompletionResponse.getCreated())
                .model(openAiCompletionResponse.getModel())
                .usage(openAiCompletionResponse.getUsage())
                .choices(openAiCompletionResponse.getChoices())
                .maxToken(openAiCompletionResponse.getMaxToken())
                .temperature(openAiCompletionResponse.getTemperature())
                .topP(openAiCompletionResponse.getTopP())
                .build();

        return completionResponse;
    }
}
