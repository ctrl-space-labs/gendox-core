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
@JsonClassDescription("Answer to one question. First the answerText need to be answered, then all the other fields. questionId must match the questionId in the request.")
public class CompletionQuestionResponse {
    @JsonPropertyDescription("Question UUID")
    private UUID questionId;
    @JsonPropertyDescription("Human readable text of the answer, according to the question asked")
    private String answerText;
    @JsonPropertyDescription("Single-value summary (like number, boolean, 1-2 word text), with the unit of measurement if applicable ($, m^2 etc.)")
    private String answerValue;
    @JsonPropertyDescription("Answer status")
    private AnswerFlag answerFlagEnum;
}
