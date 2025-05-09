package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class MistralModerationRequest {
    private String model;
    private String input;
}

