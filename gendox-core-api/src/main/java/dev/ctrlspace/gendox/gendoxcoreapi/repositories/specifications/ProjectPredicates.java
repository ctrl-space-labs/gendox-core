package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.util.StringUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QProject;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectCriteria;

import java.util.List;
import java.util.UUID;

public class ProjectPredicates {

    private static QProject qProject = QProject.project;


    public static Predicate build(ProjectCriteria criteria) {
        return ExpressionUtils.allOf(
                organizationId(criteria.getOrganizationId()),
                userId(criteria.getUserId()),
                name(criteria.getName()),
                projectIdIn(criteria.getProjectIdIn()),
                privateProjectAgent(criteria.getPrivateProjectAgent())
        );
    }

    private static Predicate organizationId(String organizationId) {
        if (StringUtils.isNullOrEmpty(organizationId)) {
            return null;
        }
        return qProject.organizationId.eq(UUID.fromString(organizationId));
    }

    private static Predicate userId(String userId) {
        if (StringUtils.isNullOrEmpty(userId)) {
            return null;
        }
        return qProject.projectMembers.any().user.id.eq(UUID.fromString(userId));
    }

    private static Predicate name(String name) {
        if (StringUtils.isNullOrEmpty(name)) {
            return null;
        }
        return qProject.name.eq(name);
    }

    private static Predicate projectIdIn(List<String> projectIdIn) {
        if (projectIdIn == null || projectIdIn.isEmpty()) {
            return null;
        }
        return qProject.id.in(projectIdIn.stream().map(UUID::fromString).toArray(UUID[]::new));
    }

    private static Predicate privateProjectAgent(Boolean privateProjectAgent) {
        if (privateProjectAgent == null) {
            return null;
        }
        return qProject.projectAgent.privateAgent.eq(privateProjectAgent);
    }
}
