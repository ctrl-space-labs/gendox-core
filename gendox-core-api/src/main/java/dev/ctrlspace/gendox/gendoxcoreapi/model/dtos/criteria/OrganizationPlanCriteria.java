package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria;


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
public class OrganizationPlanCriteria {

    private UUID organizationId;
    private Instant activeAtDate;

}
