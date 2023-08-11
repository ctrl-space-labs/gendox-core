package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.util.StringUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QOrganization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationCriteria;

import java.util.List;
import java.util.UUID;

public class OrganizationPredicates {

    private static QOrganization qOrganization = QOrganization.organization;


    public static Predicate build(OrganizationCriteria criteria) {
        return ExpressionUtils.allOf(
                organizationId(criteria.getOrganizationId()),
                userId(criteria.getUserId()),
                name(criteria.getName()),
                displayName(criteria.getDisplayName()),
                organizationIdIn(criteria.getOrganizationIdIn())
        );
    }

    private static Predicate organizationId(String organizationId) {
        if (StringUtils.isNullOrEmpty(organizationId)) {
            return null;
        }
        return qOrganization.id.eq(UUID.fromString(organizationId));
    }

    private static Predicate userId(String userId) {
        if (StringUtils.isNullOrEmpty(userId)) {
            return null;
        }
        return qOrganization.userOrganizations.any().user.id.eq(UUID.fromString(userId));
    }

    private static Predicate name(String name) {
        if (StringUtils.isNullOrEmpty(name)) {
            return null;
        }
        return qOrganization.name.eq(name);
    }

    private static Predicate displayName(String displayName) {
        if (StringUtils.isNullOrEmpty(displayName)) {
            return null;
        }
        return qOrganization.displayName.startsWith(displayName);
    }

    private static Predicate organizationIdIn(List<String> organizationIdIn) {
        if (organizationIdIn == null || organizationIdIn.isEmpty()) {
            return null;
        }
        return qOrganization.id.in(organizationIdIn.stream().map(UUID::fromString).toArray(UUID[]::new));
    }


}
