package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response.CohereCompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;

public class AiModelMessagetoCohereGenerationsTextConverter {
    public static AiModelMessage toCohereGenerationsText(CohereCompletionResponse.Content contents, String role) {
        return AiModelMessage.builder()
                .role(role)
                .content(contents.getText())
                .build();
    }
}
