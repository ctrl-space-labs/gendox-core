package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
@JsonIgnoreProperties(ignoreUnknown = true)
public class TaskNodeValueDTO {
    private String organizationId;
    private UUID nodeQuestionId;
    private UUID nodeDocumentId;
    private String message;
    private String answerValue;
    private AnswerFlag answerFlagEnum;
    private String questionTitle;
    private Integer order;
    private TaskDocumentMetadataDTO documentMetadata = new TaskDocumentMetadataDTO();
}
