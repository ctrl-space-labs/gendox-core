package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision;

import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.DecisionQuestionConfigDTO;
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
public class DecisionRequest {
    private Object state;
    @Builder.Default
    private Map<String, DecisionQuestionConfigDTO> questions = new LinkedHashMap<>();
}
