package dev.ctrlspace.gendox.gendoxcoreapi.model.authentication;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class UserProfile {

    private String id;
    private String email;
    private String globalRoleName;
    private String name;
    private List<OrganizationUserDTO> organizations;

}
