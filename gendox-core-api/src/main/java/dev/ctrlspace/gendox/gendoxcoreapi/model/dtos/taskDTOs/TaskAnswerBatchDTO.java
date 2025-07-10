package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs;

import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class TaskAnswerBatchDTO {
    List<AnswerCreationDTO> newAnswers = new ArrayList<>();
    List<TaskNode> answersToDelete = new ArrayList<>();
}
