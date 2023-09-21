package dev.ctrlspace.gendox.gendoxcoreapi.model.authentication;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class OrganizationUserDTO {

    private String id;
    private String name;
    private String displayName;
    private String phone;
    private String address;
    Set<String> authorities; //include roles and permissions
    List<ProjectOrganizationDTO> projects;

    private Instant createdAt;
    private Instant updatedAt;
}
