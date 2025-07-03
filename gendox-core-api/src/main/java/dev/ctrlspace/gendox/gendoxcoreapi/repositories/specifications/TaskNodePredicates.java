package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QTaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import java.util.UUID;

public class TaskNodePredicates {
    private static final QTaskNode qTaskNode = QTaskNode.taskNode;

    public static Predicate build(TaskNodeCriteria criteria) {
        Predicate documentPredicate = null;
        Predicate questionPredicate = null;

        // Check if documentNodeIds is provided
        if (criteria.getDocumentNodeIds() != null && !criteria.getDocumentNodeIds().isEmpty()) {
            documentPredicate = ExpressionUtils.allOf(
                    taskIdEq(criteria.getTaskId()),
                    qTaskNode.nodeType.name.eq("DOCUMENT"),
                    qTaskNode.id.in(criteria.getDocumentNodeIds())
            );
        }

        // Check if questionNodeIds is provided
        if (criteria.getQuestionNodeIds() != null && !criteria.getQuestionNodeIds().isEmpty()) {
            questionPredicate = ExpressionUtils.allOf(
                    taskIdEq(criteria.getTaskId()),
                    qTaskNode.nodeType.name.eq("QUESTION"),
                    qTaskNode.id.in(criteria.getQuestionNodeIds())
            );
        }

        // Combine predicates
        if (documentPredicate != null && questionPredicate != null) {
            return ExpressionUtils.anyOf(documentPredicate, questionPredicate);
        } else if (documentPredicate != null) {
            return documentPredicate;
        } else {
            return questionPredicate;  // if only questionPredicate is present
        }
    }

    private static Predicate taskIdEq(UUID taskId) {
        if (taskId == null) {
            return null;
        }
        return qTaskNode.taskId.eq(taskId);
    }
}

