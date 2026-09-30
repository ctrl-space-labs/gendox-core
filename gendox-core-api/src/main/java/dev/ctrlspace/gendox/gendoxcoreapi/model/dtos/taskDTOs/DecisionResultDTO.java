package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs;

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
public class DecisionResultDTO {
    private DecisionKind kind;
    private String selectedValue;
    private Double probability;
    private Double score;
    private Double confidence;
    @Builder.Default
    private Map<String, Double> probabilities = new LinkedHashMap<>();
    @Builder.Default
    private Map<String, String> legend = new LinkedHashMap<>();
    private String modelVersion;
}
