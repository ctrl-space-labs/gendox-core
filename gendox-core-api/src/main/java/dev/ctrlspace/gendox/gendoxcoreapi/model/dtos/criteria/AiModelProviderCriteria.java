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
public class AiModelProviderCriteria {

    private UUID id;
    private String name;
    // the organization's own providers
    private UUID organizationId;
    // also Gendox's providers, which have no organization
    private boolean includeGendoxProviders;
}
