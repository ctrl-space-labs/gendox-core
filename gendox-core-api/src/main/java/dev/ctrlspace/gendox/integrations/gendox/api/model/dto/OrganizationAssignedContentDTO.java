package dev.ctrlspace.gendox.integrations.gendox.api.model.dto;

import com.fasterxml.jackson.annotation.JsonCreator;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor(onConstructor_ = @JsonCreator)
@Builder(toBuilder = true)
public class OrganizationAssignedContentDTO {
    private List<AssignedProjectDTO> projects = new ArrayList<>();
}
