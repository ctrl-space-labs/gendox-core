package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QOrganizationModelProviderKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationModelKeyCriteria;

import java.util.UUID;

public class OrganizationModelKeysPredicates {


    private static QOrganizationModelProviderKey qOrganizationModelProviderKey = QOrganizationModelProviderKey.organizationModelProviderKey;

    public static Predicate build(OrganizationModelKeyCriteria criteria) {
        return ExpressionUtils.allOf(
                organizationId(criteria.getOrganizationId()),
                aiModelProviderName(criteria.getAiModelName())
        );
    }

    public static Predicate organizationId(UUID organizationId) {
        if (organizationId == null) {
            return null;
        }
        return qOrganizationModelProviderKey.organizationId.eq(organizationId);
    }

    public static Predicate aiModelProviderName(String aiModelName) {
        if (aiModelName == null) {
            return null;
        }
        return qOrganizationModelProviderKey.aiModelProvider.name.eq(aiModelName);
    }

}
