package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response.CohereGenerations;

public class AiModelMessagetoCohereGenerationsTextConverter {
    public static AiModelMessage toCohereGenerationsText(CohereGenerations cohereGenerations, String role) {
        return AiModelMessage.builder()
                .role(role)
                .content(cohereGenerations.getText())
                .build();
    }
}
