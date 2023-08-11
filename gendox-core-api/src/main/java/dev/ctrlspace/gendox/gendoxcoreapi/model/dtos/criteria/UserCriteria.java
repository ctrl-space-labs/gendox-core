package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria;


import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.validators.AtLeastOneFieldIsNotEmpty;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.validators.NotEmptyOrSuperAdmin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
@AtLeastOneFieldIsNotEmpty(fieldNames = {"organizationId", "projectId"})
public class UserCriteria {


    private String email;
    private String organizationId;
    private String projectId;
    private String orgRoleName;

}
