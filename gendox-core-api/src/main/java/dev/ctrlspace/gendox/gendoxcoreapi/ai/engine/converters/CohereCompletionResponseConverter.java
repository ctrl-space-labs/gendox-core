package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response.CohereCompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Choice;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Usage;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CohereCompletionResponseConverter {
    public CompletionResponse toCompletionResponse(CohereCompletionResponse cohereCompletionResponse) {

        Usage usage = Usage.builder()
                .completionTokens(cohereCompletionResponse.getUsage().getBilled_units().getOutput_tokens())
                .promptTokens(cohereCompletionResponse.getUsage().getBilled_units().getInput_tokens())
                .totalTokens(cohereCompletionResponse.getUsage().getBilled_units().getOutput_tokens() +
                        cohereCompletionResponse.getUsage().getBilled_units().getInput_tokens())
                .build();


        List<Choice> mappedChoices = cohereCompletionResponse.getMessage().getContent().stream()
                .map(content -> Choice.builder()
                        .index(0)
                        .finishReason(cohereCompletionResponse.getFinish_reason())
                        .message(AiModelMessage.builder()
                                .content(content.getText())
                                .role(cohereCompletionResponse.getMessage().getRole())
                                .build())
                        .build())
                .toList();

        CompletionResponse completionResponse = CompletionResponse.builder()
                .id(cohereCompletionResponse.getId())
                .model(cohereCompletionResponse.getMessage().getRole())
                .usage(usage)
                .choices(mappedChoices)
                .build();


        return completionResponse;
    }
}
