package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.GptResponse;

public class CompletionResponseConverter {
    public CompletionResponse toCompletionResponse(GptResponse gptResponse) {
        CompletionResponse completionResponse = CompletionResponse.builder()
                .id(gptResponse.getId())
                .object(gptResponse.getObject())
                .created(gptResponse.getCreated())
                .model(gptResponse.getModel())
                .usage(gptResponse.getUsage())
                .choices(gptResponse.getChoices())
                .maxToken(gptResponse.getMaxToken())
                .temperature(gptResponse.getTemperature())
                .topP(gptResponse.getTopP())
                .build();

        return completionResponse;
    }

}
