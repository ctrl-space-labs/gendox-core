package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.amazonaws.util.StringUtils;
import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectAgentCriteria;

import java.util.List;
import java.util.UUID;

public class ProjectAgentPredicates {
    private static QProjectAgent qProjectAgent = QProjectAgent.projectAgent;

    public static Predicate build(ProjectAgentCriteria criteria) {
        return ExpressionUtils.allOf(
                agentName(criteria.getAgentName()),
                organizationId(criteria.getOrganizationId()),
                projectIdIn(criteria.getProjectIdIn()),
                userId(criteria.getUserId()),
                privateAgent(criteria.getPrivateAgent())
        );
    }

    private static Predicate agentName(String agentName) {
        if (StringUtils.isNullOrEmpty(agentName)) {
            return null;
        }
        return qProjectAgent.agentName.eq(agentName);
    }

    private static Predicate organizationId(String organizationId) {
        if (StringUtils.isNullOrEmpty(organizationId)) {
            return null;
        }
        return qProjectAgent.project.organizationId.eq(UUID.fromString(organizationId));
    }

    private static Predicate projectIdIn(List<String> projectIdIn) {
        if (projectIdIn == null || projectIdIn.isEmpty()) {
            return null;
        }
        return qProjectAgent.project.id.in(projectIdIn.stream().map(UUID::fromString).toArray(UUID[]::new));
    }

    private static Predicate userId(String userId) {
        if (StringUtils.isNullOrEmpty(userId)) {
            return null;
        }
        return qProjectAgent.userId.eq(UUID.fromString(userId));
    }

    private static Predicate privateAgent(Boolean privateAgent) {
        if (privateAgent == null) {
            return null;
        }
        return qProjectAgent.privateAgent.eq(privateAgent);
    }
}
