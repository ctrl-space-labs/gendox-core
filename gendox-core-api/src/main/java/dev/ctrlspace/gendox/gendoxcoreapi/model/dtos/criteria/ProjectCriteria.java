package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria;

import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.validators.NotNullOrSuperAdmin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ProjectCriteria {

        private String name;
        @NotNullOrSuperAdmin
        private String organizationId;
        private String userId;
        private List<String> projectIdIn;
}
