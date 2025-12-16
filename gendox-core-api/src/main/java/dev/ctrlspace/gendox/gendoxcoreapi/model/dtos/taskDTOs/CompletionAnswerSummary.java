package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs;

import com.fasterxml.jackson.annotation.JsonClassDescription;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
@JsonClassDescription("Summarizes the result of multiple questions answered for the Document Insights task")
public class CompletionAnswerSummary {
    @JsonPropertyDescription("Human readable text of the answer, according to the question asked")
    private String answerText;
    @JsonPropertyDescription("Single-value summary (like number, boolean, 1-2 word text)")
    private String answerValue;
    @JsonPropertyDescription("Answer status")
    private AnswerFlag answerFlagEnum;
}
