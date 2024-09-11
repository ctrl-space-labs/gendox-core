package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;


import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ProjectDTO {

    private UUID id;
    private UUID organizationId;
    //max length 200
    @Size(max = 200)
    private String name;
    private String description;
    private Instant createdAt;
    private Instant updatedAt;
    private ProjectAgentDTO projectAgent;
    private Boolean autoTraining;




}
