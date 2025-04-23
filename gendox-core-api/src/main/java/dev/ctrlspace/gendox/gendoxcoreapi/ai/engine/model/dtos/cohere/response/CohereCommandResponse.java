package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class CohereCommandResponse {
    private String id;
    @JsonProperty("prompt")
    private String prompt;
    private String model;
    @JsonProperty("generations")
    private List<CohereGenerations> cohereGenerations;
    @JsonProperty("temperature")
    private double temperature;
    @JsonProperty("p")
    private double topP;
    @JsonProperty("max_tokens")
    private Long maxTokens;
    private CohereMetadata meta;

}
