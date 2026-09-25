package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class DecisionUsage {
    @JsonProperty("input_tokens")
    private Long inputTokens;

    @JsonProperty("output_tokens")
    private Long outputTokens;
}
