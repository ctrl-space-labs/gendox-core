package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.response.MistralCompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Choice;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Usage;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
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

        if (message.getThinking() != null) {
            builder.reasoningContent(message.getThinking());
        }
        if (message.getTool_calls() != null && !message.getTool_calls().isEmpty()) {
            builder.toolCalls(toToolCalls(message.getTool_calls()));
        }

        return builder.build();
    }

    /** The calls in the OpenAI shape the tool loop reads, with the arguments as JSON text. */
    private static ArrayNode toToolCalls(List<MistralCompletionResponse.Choice.Message.ToolCall> calls) {
        ArrayNode toolCalls = JsonNodeFactory.instance.arrayNode();
        for (MistralCompletionResponse.Choice.Message.ToolCall call : calls) {
            ObjectNode toolCall = toolCalls.addObject().put("id", call.getId()).put("type", "function");
            toolCall.putObject("function")
                    .put("name", call.getFunction().getName())
                    .put("arguments", argumentsText(call.getFunction().getArguments()));
        }
        return toolCalls;
    }

    private static String argumentsText(JsonNode arguments) {
        if (arguments == null || arguments.isNull()) {
            return "{}";
        }
        if (arguments.isTextual()) {
            return arguments.asText();
        }
        return arguments.toString();
    }
}
