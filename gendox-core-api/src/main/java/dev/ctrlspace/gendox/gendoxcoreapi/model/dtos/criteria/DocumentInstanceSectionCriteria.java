package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria;

import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.validators.AtLeastOneFieldIsNotEmpty;
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
public class DocumentInstanceSectionCriteria {

    private String projectId;
    private Boolean projectAutoTraining;
    private String documentId;
    private TimePeriodDTO createdBetween;
    private TimePeriodDTO updatedBetween;
    private Boolean reuseEmbeddings;
}
