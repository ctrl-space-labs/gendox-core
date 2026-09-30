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
public class DecisionResponse {
    private String model;
    @Builder.Default
    private Map<String, DecisionAnswer> answers = new LinkedHashMap<>();
    private DecisionUsage usage;
}
