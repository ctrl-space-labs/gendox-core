package dev.ctrlspace.gendox.gendoxcoreapi.model.authentication;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ProjectOrganizationDTO {
    private String id;
    private String name;
    private String description;
    private Instant createdAt;
    private Instant updatedAt;
}
