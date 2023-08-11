package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.RolePermission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;

import java.util.List;

public interface RolePermissionRepository extends JpaRepository<RolePermission, Long>, QuerydslPredicateExecutor<RolePermission> {

    @EntityGraph(attributePaths = {"permission", "role"})
    Page<RolePermission> findAll(Predicate predicate, Pageable pageable);
    public List<RolePermission> findByRoleId(Long roleId);

    public List<RolePermission> findByPermissionId(Long permissionId);

    public List<RolePermission> findByRoleIdAndPermissionId(Long roleId, Long permissionId);

    @EntityGraph(attributePaths = {"permission", "role"})
    public List<RolePermission> findByRoleIdIn(List<Long> roleIds);

    public List<RolePermission> findByPermissionIdIn(List<Long> permissionIds);
}
