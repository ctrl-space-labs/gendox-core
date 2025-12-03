package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
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
public class TaskDocumentMetadataDTO {
    private UUID taskNodeId;
    private String prompt;      // this is used in both insights & digitization tasks for document specific prompt
    private String structure;
    private Integer pageFrom;
    private Integer pageTo;
    private Boolean allPages; // true when user wants to process all pages (clear page range)
    private List<UUID> supportingDocumentIds; // ids of supporting documents linked to this document or Question used in insights task

    //// fields used in Digitization Job
    @JsonIgnore
    private TaskNode taskNode;
    @JsonIgnore
    private DocumentInstance documentInstance;
}
