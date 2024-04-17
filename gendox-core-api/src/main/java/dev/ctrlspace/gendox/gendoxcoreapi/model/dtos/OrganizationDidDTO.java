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
public class OrganizationDidDTO {
    private UUID id;
    private UUID organizationId;
    private UUID keyId;
    private String did;
    private String webDomain;
    private String webPath;
    private Instant createdAt;
    private Instant updatedAt;

}
