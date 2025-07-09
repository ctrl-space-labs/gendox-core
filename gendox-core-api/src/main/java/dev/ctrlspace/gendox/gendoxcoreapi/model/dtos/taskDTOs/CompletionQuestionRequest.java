package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs;

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
public class CompletionQuestionRequest {
    @JsonPropertyDescription("UUID of the question to be answered")
    private UUID questionId;
    @JsonPropertyDescription("Text of the question to be answered")
    private String questionText;
}
