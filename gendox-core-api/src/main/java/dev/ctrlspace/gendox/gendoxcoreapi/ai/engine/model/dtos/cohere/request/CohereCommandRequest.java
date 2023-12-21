package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.AiModelMessage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

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
//    @JsonProperty("prompt")
//
    @JsonProperty("prompt")
        private String prompt;
//    private List<AiModelMessage> prompt;


}
