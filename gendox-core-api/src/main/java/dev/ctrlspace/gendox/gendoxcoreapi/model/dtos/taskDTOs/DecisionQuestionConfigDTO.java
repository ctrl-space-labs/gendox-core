package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class DecisionQuestionConfigDTO {
    private DecisionKind kind;
    private String instructions;
    @Builder.Default
    private Map<String, String> booleanCriteria = new LinkedHashMap<>();
    @Builder.Default
    private Map<String, String> choices = new LinkedHashMap<>();
    @Builder.Default
    private List<String> scoreCriteria = List.of();
}
