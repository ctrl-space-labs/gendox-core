package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.response.MistralCompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Choice;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Usage;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MistralCompletionResponseConverter {

    public CompletionResponse toCompletionResponse(MistralCompletionResponse mistralCompletionResponse) {

        Usage usage = Usage.builder()
                .completionTokens(mistralCompletionResponse.getUsage().getCompletion_tokens())
                .promptTokens(mistralCompletionResponse.getUsage().getPrompt_tokens())
                .totalTokens(mistralCompletionResponse.getUsage().getTotal_tokens())
                .build();


        List<Choice> mappedChoices = mistralCompletionResponse.getChoices().stream()
                .map(choice -> Choice.builder()
                        .index(choice.getIndex())
                        .finishReason(choice.getFinish_reason())
                        .message(toAiModelMessage(choice.getMessage()))
                        .build())
                .toList();


        CompletionResponse completionResponse = CompletionResponse.builder()
                .id(mistralCompletionResponse.getId())
                .object(mistralCompletionResponse.getObject())
                .model(mistralCompletionResponse.getModel())
                .usage(usage)
                .choices(mappedChoices)
                .maxToken(mistralCompletionResponse.getUsage().getTotal_tokens().longValue())
                .build();


        return completionResponse;
    }

    private AiModelMessage toAiModelMessage(MistralCompletionResponse.Choice.Message message) {
        AiModelMessage.AiModelMessageBuilder builder = AiModelMessage.builder()
                .role(message.getRole())
                .content(message.getContent());
        if (message.getTool_calls() != null && !message.getTool_calls().isEmpty()) {
            var calls = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.arrayNode();
            for (var call : message.getTool_calls()) {
                var node = calls.addObject().put("id", call.getId()).put("type", "function");
                var args = call.getFunction().getArguments();
                node.putObject("function").put("name", call.getFunction().getName())
                        .put("arguments", args == null ? "{}" : args.isTextual() ? args.asText() : args.toString());
            }
            builder.toolCalls(calls);
        }

        if (message.getThinking() != null) {
            builder.reasoningContent(message.getThinking());
        }

        return builder.build();
    }
}
