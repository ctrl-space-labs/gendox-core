package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.anthropic.response.AnthropicCompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Choice;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Usage;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AnthropicCompletionResponseConverter {
    public CompletionResponse toCompletionResponse(AnthropicCompletionResponse anthropicCompletionResponse) {

        Usage usage = Usage.builder()
                .completionTokens(anthropicCompletionResponse.getUsage().getOutput_tokens())
                .promptTokens(anthropicCompletionResponse.getUsage().getInput_tokens())
                .totalTokens(anthropicCompletionResponse.getUsage().getInput_tokens() + anthropicCompletionResponse.getUsage().getOutput_tokens())
                .build();

        List<Choice> mappedChoices = anthropicCompletionResponse.getContent().stream()
                .map(content -> Choice.builder()
                        .index(0)
                        .finishReason(anthropicCompletionResponse.getStop_reason())
                        .message(AiModelMessage.builder()
                                .content(content.getText())
                                .role(anthropicCompletionResponse.getRole())
                                .build())
                        .build())
                .toList();

        CompletionResponse completionResponse = CompletionResponse.builder()
                .id(anthropicCompletionResponse.getId())
                .model(anthropicCompletionResponse.getModel())
                .usage(usage)
                .choices(mappedChoices)
                .build();

        return completionResponse;
    }

}
