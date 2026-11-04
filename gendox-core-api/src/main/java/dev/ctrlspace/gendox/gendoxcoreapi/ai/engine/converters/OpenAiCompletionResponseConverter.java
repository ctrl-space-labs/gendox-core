package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters;

import com.fasterxml.jackson.databind.JsonNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Choice;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiCompletionResponse;
import org.springframework.stereotype.Component;


@Component
public class OpenAiCompletionResponseConverter {

    public CompletionResponse toCompletionResponse(OpenAiCompletionResponse openAiCompletionResponse) {
        // Gemini's OpenAI-compatible API answers tool calls with "stop".
        // Other reasons ("length", "content_filter") stay, since their tool calls may be cut short.
        if (openAiCompletionResponse.getChoices() != null) {
            for (Choice choice : openAiCompletionResponse.getChoices()) {
                JsonNode toolCalls = choice.getMessage() == null ? null : choice.getMessage().getToolCalls();
                boolean stopped = choice.getFinishReason() == null || "stop".equals(choice.getFinishReason());
                if (stopped && toolCalls != null && !toolCalls.isEmpty()) {
                    choice.setFinishReason("tool_calls");
                }
            }
        }

        CompletionResponse completionResponse = CompletionResponse.builder()
                .id(openAiCompletionResponse.getId())
                .object(openAiCompletionResponse.getObject())
                .created(openAiCompletionResponse.getCreated())
                .model(openAiCompletionResponse.getModel())
                .usage(openAiCompletionResponse.getUsage())
                .choices(openAiCompletionResponse.getChoices())
                .maxToken(openAiCompletionResponse.getMaxToken())
                .temperature(openAiCompletionResponse.getTemperature())
                .topP(openAiCompletionResponse.getTopP())
                .build();

        return completionResponse;
    }
}
