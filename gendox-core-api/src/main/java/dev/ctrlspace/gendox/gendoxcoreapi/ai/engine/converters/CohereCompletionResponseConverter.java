package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response.CohereCompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Choice;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Usage;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Component
public class CohereCompletionResponseConverter {
    public CompletionResponse toCompletionResponse(CohereCompletionResponse cohereCompletionResponse) {

        Usage usage = Usage.builder()
                .completionTokens(cohereCompletionResponse.getUsage().getBilled_units().getOutput_tokens())
                .promptTokens(cohereCompletionResponse.getUsage().getBilled_units().getInput_tokens())
                .totalTokens(cohereCompletionResponse.getUsage().getBilled_units().getOutput_tokens() +
                        cohereCompletionResponse.getUsage().getBilled_units().getInput_tokens())
                .build();


        CohereCompletionResponse.Message message = cohereCompletionResponse.getMessage();
        AiModelMessage.AiModelMessageBuilder aiModelMessage = AiModelMessage.builder()
                .role(message.getRole())
                .content(text(message))
                .reasoningContent(message.getTool_plan());
        String finishReason = cohereCompletionResponse.getFinish_reason();
        if (message.getTool_calls() != null && !message.getTool_calls().isEmpty()) {
            aiModelMessage.toolCalls(message.getTool_calls());
            // Cohere says TOOL_CALL; the tool loop looks for OpenAI's name
            finishReason = "tool_calls";
        }

        List<Choice> mappedChoices = List.of(Choice.builder()
                .index(0)
                .finishReason(finishReason)
                .message(aiModelMessage.build())
                .build());

        CompletionResponse completionResponse = CompletionResponse.builder()
                .id(cohereCompletionResponse.getId())
                .model(cohereCompletionResponse.getMessage().getRole())
                .usage(usage)
                .choices(mappedChoices)
                .build();


        return completionResponse;
    }

    // A message that only calls tools has no text
    private static String text(CohereCompletionResponse.Message message) {
        if (message.getContent() == null) {
            return "";
        }
        return message.getContent().stream()
                .map(content -> Objects.requireNonNullElse(content.getText(), ""))
                .collect(Collectors.joining());
    }
}
