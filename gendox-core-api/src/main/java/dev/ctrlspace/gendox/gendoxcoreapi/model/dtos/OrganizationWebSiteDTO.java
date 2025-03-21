package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class OrganizationWebSiteDTO {
    private UUID organizationId;
    private UUID integrationId;
    private UUID apiKeyId;
    private String name;
    private String url;
}
