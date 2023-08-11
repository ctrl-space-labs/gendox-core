package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria;


import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.validators.NotNullOrSuperAdmin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class UserCriteria {


    private String email;
    @NotNullOrSuperAdmin
    private String organizationId;
    private String projectId;
    private String orgRoleName;

}
