package dev.ctrlspace.gendox.integrations.gendox.api.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class OrganizationAssignedContentDTO {
    private List<AssignedContentIdsDTO> projects;
}
