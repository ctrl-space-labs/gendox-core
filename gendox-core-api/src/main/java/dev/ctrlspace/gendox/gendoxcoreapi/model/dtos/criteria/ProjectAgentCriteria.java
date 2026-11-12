package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria;

import com.fasterxml.jackson.annotation.JsonCreator;

import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.validators.AtLeastOneFieldIsNotEmpty;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.QueryParamNames;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor(onConstructor_ = @JsonCreator)
@Builder(toBuilder = true)
public class ProjectAgentCriteria {
    private String agentName;
    private String organizationId;
    private List<String> projectIdIn = new ArrayList<>();
    private String userId;
    private Boolean privateAgent;
    private List<UUID> agentIdIn;

}
