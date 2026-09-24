package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class GeneratedDecisionQuestionsDTO {
    @Builder.Default
    private List<GeneratedDecisionQuestionDTO> questions = new ArrayList<>();
}
