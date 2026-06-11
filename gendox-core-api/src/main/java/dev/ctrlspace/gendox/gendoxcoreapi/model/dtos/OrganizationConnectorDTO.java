package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class OrganizationConnectorDTO {

    private UUID id;
    private UUID organizationId;
    private String connectorType;
    private Boolean isActive;
    private Map<String, Object> config;
    private Instant createdAt;
    private Instant updatedAt;
}
