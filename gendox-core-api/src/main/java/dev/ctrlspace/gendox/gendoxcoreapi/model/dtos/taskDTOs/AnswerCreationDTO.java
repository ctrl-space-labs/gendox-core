package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs;

import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class AnswerCreationDTO {
    TaskNodeDTO newAnswer;
    TaskNode documentNode;
    TaskNode questionNode;
}
