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
public class RolePermissionCriteria {

    private Long roleId;
    private String roleName;
    private Long permissionId;
    private String permissionName;
    private List<Long> roleIdIn;
    private List<String> roleNameIn;
    private List<Long> permissionIdIn;
    private List<String> permissionNameIn;
}
