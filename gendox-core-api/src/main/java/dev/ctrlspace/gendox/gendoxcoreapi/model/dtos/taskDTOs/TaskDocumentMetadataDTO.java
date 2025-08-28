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
public class TaskDocumentMetadataDTO {
    private UUID taskNodeId;
    private String prompt;
    private String structure;
    private Integer pageFrom;
    private Integer pageTo;
    private Boolean allPages; // true when user wants to process all pages (clear page range)
}
