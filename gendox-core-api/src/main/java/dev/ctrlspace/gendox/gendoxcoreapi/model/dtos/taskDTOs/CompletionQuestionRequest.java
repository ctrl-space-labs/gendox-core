package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.MessageLocalContext;
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
    // Use to serialize the question id in the LLM request
    @JsonPropertyDescription("UUID of the question to be answered")
    private UUID questionId;
    // Use to serialize the question text in the LLM request
    @JsonPropertyDescription("Text of the question to be answered")
    private String questionText;
    // Used as a dto only. The local context will be serialized in another fields in the completion template
    @JsonIgnore
    private MessageLocalContext questionSupportingDocsLocalContext;
}
