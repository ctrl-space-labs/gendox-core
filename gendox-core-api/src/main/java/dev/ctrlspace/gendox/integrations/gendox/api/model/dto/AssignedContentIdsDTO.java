package dev.ctrlspace.gendox.integrations.gendox.api.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class AssignedContentIdsDTO {
    private UUID projectId;
    private String name;
    private String description;
    private AssignedContentDTO assignedContent;

}
