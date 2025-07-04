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
public class TaskNodeDTO {
    private UUID id;
    private UUID taskId;
    private String nodeType;
    private TaskNodeValueDTO nodeValue;
    private UUID parentNodeId;
    private UUID documentId;
    private Integer pageNumber;
    private UUID userId;

}
