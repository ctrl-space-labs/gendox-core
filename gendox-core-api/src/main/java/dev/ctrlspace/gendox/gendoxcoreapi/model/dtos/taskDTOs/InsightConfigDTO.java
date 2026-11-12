package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs;

import com.fasterxml.jackson.annotation.JsonCreator;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor(onConstructor_ = @JsonCreator)
@AllArgsConstructor
@Builder(toBuilder = true)
public class InsightConfigDTO {
    @Builder.Default
    private Integer version = 1;
    @Builder.Default
    private InsightAnswerMode answerMode = InsightAnswerMode.GENERATED_TEXT;
    private DecisionQuestionConfigDTO decision;
    private String sourceQuestion;

    public static InsightConfigDTO generatedText() {
        return InsightConfigDTO.builder().answerMode(InsightAnswerMode.GENERATED_TEXT).build();
    }
}
