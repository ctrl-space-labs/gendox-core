package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class TaskDuplicateDTO {
    private UUID taskId;
    private boolean keepQuestions;
    private boolean keepDocuments;
    private String newTitle;
    private String newDescription;

}
