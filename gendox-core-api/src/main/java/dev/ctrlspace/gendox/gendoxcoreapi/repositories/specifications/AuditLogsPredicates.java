package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import dev.ctrlspace.gendox.gendoxcoreapi.model.QAuditLogs;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.AuditLogsCriteria;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.types.ExpressionUtils;

import java.util.UUID;

public class AuditLogsPredicates {

    private static QAuditLogs qAuditLogs = QAuditLogs.auditLogs;

    public static Predicate build(AuditLogsCriteria criteria) {
        return ExpressionUtils.allOf(
                userId(String.valueOf(criteria.getUserId())),
                projectId(String.valueOf(criteria.getProjectId())),
                organizationId(String.valueOf(criteria.getOrganizationId()))

        );
    }

    private static Predicate userId(String userId) {
        if (userId == null) {
            return null;
        }
        return qAuditLogs.userId.eq(UUID.fromString(userId));
    }

    private static Predicate projectId(String projectId) {
        if (projectId == null) {
            return null;
        }
        return qAuditLogs.projectId.eq(UUID.fromString(projectId));
    }

    private static Predicate organizationId(String organizationId) {
        if (organizationId == null) {
            return null;
        }
        return qAuditLogs.organizationId.eq(UUID.fromString(organizationId));}





}
