package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.RolePermission;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {

    public List<RolePermission> findByRoleId(Long roleId);

    public List<RolePermission> findByPermissionId(Long permissionId);

    public List<RolePermission> findByRoleIdAndPermissionId(Long roleId, Long permissionId);

    @EntityGraph(attributePaths = {"permission", "role"})
    public List<RolePermission> findByRoleIdIn(List<Long> roleIds);

    public List<RolePermission> findByPermissionIdIn(List<Long> permissionIds);
}
