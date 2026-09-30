package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@JsonIgnoreProperties(ignoreUnknown = true)
public class DecisionAnswer {
    private String type;
    private Double noul;
    private String choice;
    private Double score;
    private Double confidence;
    @Builder.Default
    private Map<String, Double> probabilities = new LinkedHashMap<>();
    @Builder.Default
    private Map<String, String> legend = new LinkedHashMap<>();
}
