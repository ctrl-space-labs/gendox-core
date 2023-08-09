package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class UserCriteria {


    private String email;
    private String organizationId;
    private String projectId;
    //the role that has in an organization
    private String role;
}
