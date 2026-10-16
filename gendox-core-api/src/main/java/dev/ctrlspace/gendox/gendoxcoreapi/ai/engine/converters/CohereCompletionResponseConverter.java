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


        var message = cohereCompletionResponse.getMessage();
        String text = message.getContent() == null ? "" : message.getContent().stream()
                .map(c -> c.getText() == null ? "" : c.getText()).collect(java.util.stream.Collectors.joining());
        List<Choice> mappedChoices = List.of(Choice.builder().index(0)
                .finishReason(message.getTool_calls() != null && !message.getTool_calls().isEmpty() ? "tool_calls" : cohereCompletionResponse.getFinish_reason())
                .message(AiModelMessage.builder().role(message.getRole()).content(text)
                        .toolCalls(message.getTool_calls()).reasoningContent(message.getTool_plan()).build()).build());


        CompletionResponse completionResponse = CompletionResponse.builder()
                .id(cohereCompletionResponse.getId())
                .model(cohereCompletionResponse.getMessage().getRole())
                .usage(usage)
                .choices(mappedChoices)
                .build();


        return completionResponse;
    }
}
