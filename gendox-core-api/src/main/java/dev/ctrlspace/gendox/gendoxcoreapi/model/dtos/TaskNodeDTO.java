package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
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
    private String content;
    private UUID parentNodeId;
    private UUID documentId;
    private Integer pageNumber;
    private UUID userId;

}
