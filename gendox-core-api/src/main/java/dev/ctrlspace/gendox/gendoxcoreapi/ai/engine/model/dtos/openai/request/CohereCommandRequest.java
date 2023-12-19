package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class CohereCommandRequest {
    private String model;
    @JsonProperty("temperature")
    private double temperature;
    @JsonProperty("p")
    private double topP;
    @JsonProperty("k")
    private int k;
    @JsonProperty("max_tokens")
    private Long maxTokens;
    @JsonProperty("prompt")
    private String prompt;


}
