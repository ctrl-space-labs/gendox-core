package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class OrganizationCriteria {


    private String organizationId;
    private String userId;
    private String name;
    private String displayName;
    private List<String> organizationIdIn; //this is mandatory for simple users
}
