package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class TaskNodeValueDTO {
    private String organizationId;
    private String message;
    private String questionNodeId;
    private String documentNodeId;
}
