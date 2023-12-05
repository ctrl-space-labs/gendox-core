package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request;

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
public class GptRequest {
    private String model;
    private List<AiMessage> messages;
    @JsonProperty("temperature")
    private double temperature;
    @JsonProperty("top_p")
    private double topP;
    @JsonProperty("max_tokens")
    private Long maxTokens;


}

