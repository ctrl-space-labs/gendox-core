package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria;


import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.validators.AtLeastOneFieldIsNotEmpty;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.validators.NotEmptyOrSuperAdmin;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.QueryParamNames;
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
//@AtLeastOneFieldIsNotEmpty(fieldNames = {QueryParamNames.ORGANIZATION_ID, QueryParamNames.PROJECT_ID}) // with this the fetchAll will not work
public class UserCriteria {
    private String email;
    private String organizationId;
    private String projectId;
    private String orgRoleName;
    private String userIdentifier; // email or username or phone
    private List<UUID> usersIds;
    private boolean fetchAll;



}
