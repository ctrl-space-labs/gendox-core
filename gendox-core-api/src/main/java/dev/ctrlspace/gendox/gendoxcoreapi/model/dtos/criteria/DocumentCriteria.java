package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria;

import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.validators.AtLeastOneFieldIsNotEmpty;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.QueryParamNames;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
//@AtLeastOneFieldIsNotEmpty(fieldNames = {QueryParamNames.PROJECT_ID, QueryParamNames.ORGANIZATION_ID, QueryParamNames.DOCUMENT_INSTANCE_ID, QueryParamNames.DOCUMENT_INSTANCE_IDS})
public class DocumentCriteria {

    private String projectId;
    private String organizationId;
    private String documentInstanceId;
    private List<String> documentInstanceIds;
    private TimePeriodDTO createdBetween;
    private TimePeriodDTO updatedBetween;


}
