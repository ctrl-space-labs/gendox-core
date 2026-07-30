package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.StringExpression;
import com.querydsl.core.util.StringUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QTask;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskCriteria;

import java.util.UUID;

public class TaskPredicates {

    private static final QTask qTask = QTask.task;

    public static Predicate build(TaskCriteria criteria) {
        return ExpressionUtils.allOf(
                projectId(criteria.getProjectId()),
                taskNameContains(criteria.getTaskNameContains())
        );
    }

    private static Predicate projectId(String projectId) {
        if (StringUtils.isNullOrEmpty(projectId)) {
            return null;
        }
        return qTask.projectId.eq(UUID.fromString(projectId));
    }

    private static Predicate taskNameContains(String taskNameContains) {
        if (StringUtils.isNullOrEmpty(taskNameContains)) {
            return null;
        }

        StringExpression normalizedTitle =
                Expressions.stringTemplate(
                        "cast(function('unaccent', lower({0})) as string)",
                        qTask.title
                );
        StringExpression normalizedDescription =
                Expressions.stringTemplate(
                        "cast(function('unaccent', lower({0})) as string)",
                        qTask.description
                );
        StringExpression normalizedTypeName =
                Expressions.stringTemplate(
                        "cast(function('unaccent', lower({0})) as string)",
                        qTask.taskType.name
                );

        String pattern = "%" + taskNameContains + "%";
        StringExpression normalizedPattern =
                Expressions.stringTemplate(
                        "cast(function('unaccent', lower({0})) as string)",
                        Expressions.constant(pattern)
                );

        BooleanExpression titleExpr = normalizedTitle.like(normalizedPattern);
        BooleanExpression descriptionExpr = normalizedDescription.like(normalizedPattern);
        BooleanExpression typeExpr = normalizedTypeName.like(normalizedPattern);

        return titleExpr.or(descriptionExpr).or(typeExpr);
    }
}
