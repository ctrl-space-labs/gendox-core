package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QUserOrganization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.UserOrganizationCriteria;

import java.util.UUID;

public class UserOrganizationPredicate {


    private static QUserOrganization userOrganization = QUserOrganization.userOrganization;

    public static Predicate build(UserOrganizationCriteria criteria) {
        return ExpressionUtils.allOf(
                organizationId(criteria.getOrganizationId()),
                userId(criteria.getUserId()),
                roleName(criteria.getRoleName())
        );
    }

    private static Predicate organizationId(String organizationId) {
        if (organizationId == null) {
            return null;
        }
        return userOrganization.organization.id.eq(UUID.fromString(organizationId));
    }

    private static Predicate userId(String userId) {
        if (userId == null) {
            return null;
        }
        return userOrganization.user.id.eq(UUID.fromString(userId));
    }

    private static Predicate roleName(String roleName) {
        if (roleName == null) {
            return null;
        }
        return userOrganization.role.name.eq(roleName);
    }



}
