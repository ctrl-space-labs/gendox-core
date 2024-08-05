package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QOrganizationDid;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QOrganizationPlan;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationDidCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationPlanCriteria;

import java.time.Instant;
import java.util.UUID;

public class OrganizationPlanPredicates {
    private static QOrganizationPlan qOrganizationPlan = QOrganizationPlan.organizationPlan;

    public static Predicate build(OrganizationPlanCriteria criteria) {
        return ExpressionUtils.allOf(
                organizationId(criteria.getOrganizationId()),
                activeAtDate(criteria.getActiveAtDate())
        );
    }


    private static Predicate organizationId(UUID organizationId) {
        if (organizationId == null) {
            return null;
        }
        return QOrganizationPlan.organizationPlan.organization.id.eq(organizationId);
    }

    private static Predicate activeAtDate(Instant activeAtDate) {
        if (activeAtDate == null) {
            return null;
        }
        return QOrganizationPlan.organizationPlan.startDate
                .loe(activeAtDate)
                .and(QOrganizationPlan.organizationPlan.endDate.goe(activeAtDate));
    }

}
