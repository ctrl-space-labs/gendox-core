package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiGptResponse;
import org.springframework.stereotype.Component;

@Component
public class CompletionResponseConverter {
    public CompletionResponse toCompletionResponse(OpenAiGptResponse openAiGptResponse) {
        CompletionResponse completionResponse = CompletionResponse.builder()
                .id(openAiGptResponse.getId())
                .object(openAiGptResponse.getObject())
                .created(openAiGptResponse.getCreated())
                .model(openAiGptResponse.getModel())
                .usage(openAiGptResponse.getUsage())
                .choices(openAiGptResponse.getChoices())
                .maxToken(openAiGptResponse.getMaxToken())
                .temperature(openAiGptResponse.getTemperature())
                .topP(openAiGptResponse.getTopP())
                .build();

        return completionResponse;
    }

}
