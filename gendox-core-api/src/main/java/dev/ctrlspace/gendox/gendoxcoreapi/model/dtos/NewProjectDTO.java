package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

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
public class NewProjectDTO {
    private UUID id;
    private UUID organizationId;
    private String name;
    private String description;
    private Instant createdAt;
    private Instant updatedAt;
    private Boolean autoTraining;
}
