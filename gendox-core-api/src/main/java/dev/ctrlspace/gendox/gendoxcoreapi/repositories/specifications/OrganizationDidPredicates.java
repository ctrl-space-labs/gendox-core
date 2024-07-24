package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QOrganizationDid;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationDidCriteria;

import java.util.List;
import java.util.UUID;

public class OrganizationDidPredicates {
    private static QOrganizationDid qOrganizationDid = QOrganizationDid.organizationDid;

    public static Predicate build(OrganizationDidCriteria criteria) {
        return ExpressionUtils.allOf(
                organizationId(criteria.getOrganizationId()),
                organizationDidIdIn(criteria.getOrganizationDidIdIn()),
                keyId(criteria.getKeyId()),
                keyIdIn(criteria.getKeyIdIn())
        );
    }

    private static Predicate organizationId(String organizationId) {
        if (organizationId == null) {
            return null;
        }
        return QOrganizationDid.organizationDid.id.eq(UUID.fromString(organizationId));
    }

    private static Predicate organizationDidIdIn(List<String> organizationDidIdIn) {
        if (organizationDidIdIn == null || organizationDidIdIn.isEmpty()) {
            return null;
        }
        return qOrganizationDid.id.in(organizationDidIdIn.stream().map(UUID::fromString).toArray(UUID[]::new));
    }

    private static Predicate keyId(String keyId) {
        if (keyId == null) {
            return null;
        }
        return qOrganizationDid.keyId.eq(UUID.fromString(keyId));
    }

    private static Predicate keyIdIn(List<String> keyIdIn) {
        if (keyIdIn == null || keyIdIn.isEmpty()) {
            return null;
        }
        return qOrganizationDid.keyId.in(keyIdIn.stream().map(UUID::fromString).toArray(UUID[]::new));
    }
}
