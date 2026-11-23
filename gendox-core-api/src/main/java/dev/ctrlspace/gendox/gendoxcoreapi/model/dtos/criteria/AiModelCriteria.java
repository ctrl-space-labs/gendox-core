package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class AiModelCriteria {

    private UUID id;
    private String name;
    // the organization's own models
    private UUID organizationId;
    // also Gendox's models, which have no organization
    private boolean includeGendoxModels;
    private UUID aiModelProviderId;
}
