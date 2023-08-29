package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QUser;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.UserCriteria;

import java.util.UUID;

public class UserPredicate {

    private static QUser user = QUser.user;

    public static Predicate build(UserCriteria criteria) {
        return ExpressionUtils.allOf(
                email(criteria.getEmail()),
                organizationId(criteria.getOrganizationId()),
                projectId(criteria.getProjectId()),
                roleName(criteria.getOrgRoleName())
        );
    }

    private static Predicate email(String email) {
        return email != null ? user.email.eq(email) : null;
    }

    private static Predicate organizationId(String organizationId) {
        return organizationId != null ? user.userOrganizations.any().organization.id.eq(UUID.fromString(organizationId)) : null;
    }

    private static Predicate projectId(String projectId) {
        return projectId != null ? user.projectMembers.any().project.id.eq(UUID.fromString(projectId)) : null;
    }

    private static Predicate roleName(String roleName) {
        return roleName != null ? user.userOrganizations.any().role.name.eq(roleName) : null;
    }





}
