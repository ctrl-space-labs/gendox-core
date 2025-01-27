package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QRolePermission;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.RolePermissionCriteria;

import java.util.List;

public class RolePermissionPredicates {

    private static QRolePermission qRolePermission = QRolePermission.rolePermission;

    public static Predicate build(RolePermissionCriteria criteria) {
        return ExpressionUtils.allOf(
                roleId(criteria.getRoleId()),
                roleName(criteria.getRoleName()),
                permissionId(criteria.getPermissionId()),
                permissionName(criteria.getPermissionName()),
                roleIdIn(criteria.getRoleIdIn()),
                roleNameIn(criteria.getRoleNameIn()),
                permissionIdIn(criteria.getPermissionIdIn()),
                permissionNameIn(criteria.getPermissionNameIn())
        );
    }

    private static Predicate roleId(Long roleId) {
        if (roleId == null) {
            return null;
        }
        return qRolePermission.role.id.eq(roleId);
    }

    private static Predicate roleName(String roleName) {
        if (roleName == null) {
            return null;
        }
        return qRolePermission.role.name.eq(roleName);
    }

    private static Predicate permissionId(Long permissionId) {
        if (permissionId == null) {
            return null;
        }
        return qRolePermission.permission.id.eq(permissionId);
    }

    private static Predicate permissionName(String permissionName) {
        if (permissionName == null) {
            return null;
        }
        return qRolePermission.permission.name.eq(permissionName);
    }

    private static Predicate roleIdIn(List<Long> roleIdIn) {
        if (roleIdIn == null || roleIdIn.isEmpty() || roleIdIn.stream().allMatch(java.util.Objects::isNull)) {
            return null;
        }
        return qRolePermission.role.id.in(roleIdIn);
    }

    private static Predicate roleNameIn(List<String> roleNameIn) {
        if (roleNameIn == null || roleNameIn.isEmpty()) {
            return null;
        }
        return qRolePermission.role.name.in(roleNameIn);
    }

    private static Predicate permissionIdIn(List<Long> permissionIdIn) {
        if (permissionIdIn == null || permissionIdIn.isEmpty()) {
            return null;
        }
        return qRolePermission.permission.id.in(permissionIdIn);
    }

    private static Predicate permissionNameIn(List<String> permissionNameIn) {
        if (permissionNameIn == null || permissionNameIn.isEmpty()) {
            return null;
        }
        return qRolePermission.permission.name.in(permissionNameIn);
    }


}
