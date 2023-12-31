package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response.CohereCommandResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response.CohereGenerations;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Choice;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Usage;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class CohereCompletionResponseConverter {
    public CompletionResponse toCompletionResponse(CohereCommandResponse cohereCommandResponse) {

        Usage usage = Usage.builder()
                .completionTokens(cohereCommandResponse.getMeta().getBilledUnits().getOutputTokens())
                .promptTokens(cohereCommandResponse.getMeta().getBilledUnits().getInputTokens())
                .totalTokens(cohereCommandResponse.getMeta().getBilledUnits().getInputTokens() +
                        cohereCommandResponse.getMeta().getBilledUnits().getOutputTokens())
                .build();

        List<CohereGenerations> cohereGenerationsList = cohereCommandResponse.getCohereGenerations();
        List<Choice> choices = new ArrayList<>();
        for (CohereGenerations generation : cohereGenerationsList) {
            AiModelMessage aiModelMessage = AiModelMessagetoCohereGenerationsTextConverter.toCohereGenerationsText(generation, "assistant");

            Choice choice = Choice.builder()
                    .index(generation.getIndex())
                    .message(aiModelMessage)
                    .build();

            choices.add(choice);
        }

        CompletionResponse completionResponse = CompletionResponse.builder()
                .id(cohereCommandResponse.getId())
                .prompt(String.valueOf(cohereCommandResponse.getPrompt()))
                .model(cohereCommandResponse.getModel())
                .usage(usage)
                .choices(choices)
                .maxToken(cohereCommandResponse.getMaxTokens())
                .temperature(cohereCommandResponse.getTemperature())
                .topP(cohereCommandResponse.getTopP())
                .build();

        return completionResponse;
    }
}
