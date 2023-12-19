package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.CohereCommandResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiGptResponse;
import org.springframework.stereotype.Component;

@Component
public class CompletionResponseConverter {
    public CompletionResponse OpenAitoCompletionResponse(OpenAiGptResponse openAiGptResponse) {
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
    public CompletionResponse coheretoCompletionResponse(CohereCommandResponse cohereCommandResponse) {
        CompletionResponse completionResponse = CompletionResponse.builder()
                .id(cohereCommandResponse.getId())
                .prompt(cohereCommandResponse.getPrompt())
                .model(cohereCommandResponse.getModel())
                .cohereBilledUnits(cohereCommandResponse.getCohereBilledUnits())
                .choices(cohereCommandResponse.getChoices())
                .maxToken(cohereCommandResponse.getMaxTokens())
                .temperature(cohereCommandResponse.getTemperature())
                .topP(cohereCommandResponse.getTopP())
                .build();

        return completionResponse;
    }
}
