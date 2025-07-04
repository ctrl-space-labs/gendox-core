package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs;

import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;

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
public class TaskDocumentInsightsDTO {
    private UUID taskId;
    private List<TaskNode> documentNodes;
    private List<TaskNode> questionNodes;
}


