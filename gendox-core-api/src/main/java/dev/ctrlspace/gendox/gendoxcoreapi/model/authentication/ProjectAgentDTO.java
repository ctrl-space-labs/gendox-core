package dev.ctrlspace.gendox.gendoxcoreapi.model.authentication;

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
public class ProjectAgentDTO {

    private UUID id;
    private UUID userId;
    private String agentName;

    private UUID projectId;

    private Instant createdAt;
    private Instant updatedAt;

}
