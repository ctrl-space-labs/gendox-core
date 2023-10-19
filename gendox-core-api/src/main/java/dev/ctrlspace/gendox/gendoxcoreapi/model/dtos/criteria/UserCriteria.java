package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria;


import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.validators.AtLeastOneFieldIsNotEmpty;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.validators.NotEmptyOrSuperAdmin;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.QueryParamNames;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
@AtLeastOneFieldIsNotEmpty(fieldNames = {QueryParamNames.ORGANIZATION_ID, QueryParamNames.PROJECT_ID})
public class UserCriteria {
    private String email;
    private String organizationId;
    private String projectId;
    private String orgRoleName;

    private String userIdentifier; // email or username or phone

}
