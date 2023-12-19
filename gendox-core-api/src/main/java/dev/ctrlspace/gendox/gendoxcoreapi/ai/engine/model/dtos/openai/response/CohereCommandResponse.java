package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response;

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
    private String prompt;
    private String model;
    @JsonProperty("generations")
    private List<Choice> choices;
    private CohereBilledUnits cohereBilledUnits;
    @JsonProperty("temperature")
    private double temperature;
    @JsonProperty("p")
    private double topP;
    @JsonProperty("max_tokens")
    private Long maxTokens;

}
