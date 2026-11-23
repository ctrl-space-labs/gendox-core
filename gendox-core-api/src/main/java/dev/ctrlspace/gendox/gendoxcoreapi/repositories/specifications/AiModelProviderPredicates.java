package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QAiModelProvider;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.AiModelProviderCriteria;

import java.util.UUID;

public class AiModelProviderPredicates {

    private static QAiModelProvider qAiModelProvider = QAiModelProvider.aiModelProvider;

    public static Predicate build(AiModelProviderCriteria criteria) {
        return ExpressionUtils.allOf(
                id(criteria.getId()),
                name(criteria.getName()),
                organizationId(criteria.getOrganizationId(), criteria.isIncludeGendoxProviders())
        );
    }

    private static Predicate id(UUID id) {
        return id == null ? null : qAiModelProvider.id.eq(id);
    }

    private static Predicate name(String name) {
        return name == null ? null : qAiModelProvider.name.eq(name);
    }

    // the organization's own providers, and Gendox's (no organization) when included
    private static Predicate organizationId(UUID organizationId, boolean includeGendoxProviders) {
        if (!includeGendoxProviders) {
            return organizationId == null ? null : qAiModelProvider.organizationId.eq(organizationId);
        }
        return organizationId == null
                ? qAiModelProvider.organizationId.isNull()
                : qAiModelProvider.organizationId.isNull().or(qAiModelProvider.organizationId.eq(organizationId));
    }
}
