package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class AiModelRequestParams {
    private String url;
    private Long maxTokens;
    private Double temperature;
    private Double topP;
    private int k;
    /** none | minimal | low | medium | high. Resolved agent-first, then the model's default. */
    private String reasoningEffort;

}
