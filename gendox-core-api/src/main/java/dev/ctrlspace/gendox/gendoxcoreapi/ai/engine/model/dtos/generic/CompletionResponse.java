package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Choice;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Usage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class CompletionResponse {

    private String id;
    private String object;
    private long created;
    private String model;
    private Usage usage;
    private List<Choice> choices;
    private Long maxToken;
    private double temperature;
    private double topP;
    private String prompt;
    private int k;


}
