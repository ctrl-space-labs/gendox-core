package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
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
@AtLeastOneFieldIsNotEmpty(fieldNames = {QueryParamNames.PROJECT_ID})
public class IntegrationCriteria {
    private String projectId;
    private String directoryPath;
    private String url;
    private String repoHead;






}
