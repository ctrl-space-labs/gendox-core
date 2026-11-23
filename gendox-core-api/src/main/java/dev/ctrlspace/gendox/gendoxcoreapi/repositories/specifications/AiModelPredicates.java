package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QAiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.AiModelCriteria;

import java.util.UUID;

public class AiModelPredicates {

    private static QAiModel qAiModel = QAiModel.aiModel;

    public static Predicate build(AiModelCriteria criteria) {
        return ExpressionUtils.allOf(
                id(criteria.getId()),
                name(criteria.getName()),
                organizationId(criteria.getOrganizationId(), criteria.isIncludeGendoxModels()),
                aiModelProviderId(criteria.getAiModelProviderId())
        );
    }

    private static Predicate id(UUID id) {
        return id == null ? null : qAiModel.id.eq(id);
    }

    private static Predicate name(String name) {
        return name == null ? null : qAiModel.name.eq(name);
    }

    // the organization's own models, and Gendox's (no organization) when included
    private static Predicate organizationId(UUID organizationId, boolean includeGendoxModels) {
        if (!includeGendoxModels) {
            return organizationId == null ? null : qAiModel.organizationId.eq(organizationId);
        }
        return organizationId == null
                ? qAiModel.organizationId.isNull()
                : qAiModel.organizationId.isNull().or(qAiModel.organizationId.eq(organizationId));
    }

    private static Predicate aiModelProviderId(UUID aiModelProviderId) {
        return aiModelProviderId == null ? null : qAiModel.aiModelProvider.id.eq(aiModelProviderId);
    }
}
