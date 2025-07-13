package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class TaskNodeValueDTO {
    private String organizationId;
    private UUID nodeQuestionId;
    private UUID nodeDocumentId;
    private String message;
    private String answerValue;
    private AnswerFlag answerFlagEnum;
    private Integer order;
}
