package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class OpenAiGptRequest {
    private String model;
    private List<AiModelMessage> messages;
    @JsonProperty("temperature")
    private double temperature;
    @JsonProperty("top_p")
    private double topP;
    @JsonProperty("max_tokens")
    private Long maxTokens;
    @JsonProperty("max_completion_tokens")
    private Long maxCompletionTokens;


}

