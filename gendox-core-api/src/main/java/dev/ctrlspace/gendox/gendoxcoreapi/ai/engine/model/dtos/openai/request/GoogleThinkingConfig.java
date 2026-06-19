package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class GoogleThinkingConfig {
    @JsonProperty("thinking_level")
    private String thinkingLevel;
    @JsonProperty("thinking_budget")
    private Integer thinkingBudget;
    @JsonProperty("include_thoughts")
    private Boolean includeThoughts;
}
