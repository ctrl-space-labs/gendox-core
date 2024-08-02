package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QUser;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.UserCriteria;

import java.util.List;
import java.util.UUID;

public class UserPredicate {

    private static QUser user = QUser.user;

    public static Predicate build(UserCriteria criteria) {

        // If fetchAll is true, return a predicate that always evaluates to true
        if (criteria.isFetchAll()) {
            return user.isNotNull();
        }

        return ExpressionUtils.allOf(
                email(criteria.getEmail()),
                organizationId(criteria.getOrganizationId()),
                projectId(criteria.getProjectId()),
                userIdentifier(criteria.getUserIdentifier()),
                roleName(criteria.getOrgRoleName()),
                userIds(criteria.getUsersIds())
        );
    }

    private static Predicate userIds(List<UUID> usersIds) {
        if (usersIds == null || usersIds.isEmpty()) {
            return null;
        }
        return user.id.in(usersIds);
    }

    private static Predicate email(String email) {
        return email != null ? user.email.eq(email.toLowerCase()) : null;
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

    private static Predicate userIdentifier(String userIdentifier) {
        if (userIdentifier == null) {
            return null;
        }
        return user.email.eq(userIdentifier.toLowerCase())
                .or(user.userName.eq(userIdentifier.toLowerCase()))
                .or(user.phone.eq(userIdentifier.toLowerCase()));
    }




}
