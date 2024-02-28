package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria;

import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.validators.AtLeastOneFieldIsNotEmpty;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.validators.NotEmptyOrSuperAdmin;
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
public class ProjectCriteria {

        private String name;
        private String organizationId;
        private String userId;
        //populate in controller as default with user's projects
        private List<String> projectIdIn;
}
