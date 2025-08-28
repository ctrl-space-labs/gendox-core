package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QTaskEdge;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskEdgeCriteria;

import java.util.List;
import java.util.UUID;

public class TaskEdgePredicates {
    private static final QTaskEdge qTaskEdge = QTaskEdge.taskEdge;

    public static Predicate build(TaskEdgeCriteria criteria) {
        return ExpressionUtils.allOf(
                relationTypeEq(criteria.getRelationType()),
                fromNodeIdIn(criteria.getFromNodeIds()),
                toNodeIdIn(criteria.getToNodeIds())
        );
    }

    private static Predicate relationTypeEq(String relationTypeName) {
        if (relationTypeName == null || relationTypeName.isEmpty()) {
            return null;
        }
        // Join with Type entity on relationType to filter by name
        return qTaskEdge.relationType.name.eq(relationTypeName);
    }

    private static Predicate fromNodeIdIn(List<UUID> fromNodeIds) {
        if (fromNodeIds == null || fromNodeIds.isEmpty()) {
            return null;
        }
        return qTaskEdge.fromNode.id.in(fromNodeIds);
    }

    private static Predicate toNodeIdIn(List<UUID> toNodeIds) {
        if (toNodeIds == null || toNodeIds.isEmpty()) {
            return null;
        }
        return qTaskEdge.toNode.id.in(toNodeIds);
    }
}

