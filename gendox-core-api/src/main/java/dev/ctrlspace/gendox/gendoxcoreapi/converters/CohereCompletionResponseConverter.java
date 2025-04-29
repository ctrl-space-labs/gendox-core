package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response.CohereCompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Choice;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Usage;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class CohereCompletionResponseConverter {
    public CompletionResponse toCompletionResponse(CohereCompletionResponse cohereCompletionResponse) {

        Usage usage = Usage.builder()
                .completionTokens(cohereCompletionResponse.getUsage().getBilledUnits().getInputTokens())
                .promptTokens(cohereCompletionResponse.getUsage().getBilledUnits().getInputTokens())
                .totalTokens(cohereCompletionResponse.getUsage().getBilledUnits().getInputTokens() +
                        cohereCompletionResponse.getUsage().getBilledUnits().getInputTokens())
                .build();


        List<CohereCompletionResponse.Content> contents = cohereCompletionResponse.getMessage().getContent();
        List<Choice> choices = new ArrayList<>();
        for (CohereCompletionResponse.Content content : contents) {
            AiModelMessage aiModelMessage = AiModelMessagetoCohereGenerationsTextConverter.toCohereGenerationsText(content, "assistant");

            Choice choice = Choice.builder()
                    .message(aiModelMessage)
                    .build();

            choices.add(choice);
        }

        CompletionResponse completionResponse = CompletionResponse.builder()
                .id(cohereCompletionResponse.getId())
                .prompt(cohereCompletionResponse.getPrompt())
                .model(cohereCompletionResponse.getModel())
                .usage(usage)
                .choices(choices)
                .maxToken(cohereCompletionResponse.getMaxToken())
                .temperature(cohereCompletionResponse.getTemperature())
                .topP(cohereCompletionResponse.getTopP())
                .build();
//                .id(cohereCommandResponse.getId())
//                .prompt(String.valueOf(cohereCommandResponse.getPrompt()))
//                .model(cohereCommandResponse.getModel())
//                .usage(usage)
//                .choices(choices)
//                .maxToken(cohereCommandResponse.getMaxTokens())
//                .temperature(cohereCommandResponse.getTemperature())
//                .topP(cohereCommandResponse.getTopP())
//                .build();

        return completionResponse;
    }
}
