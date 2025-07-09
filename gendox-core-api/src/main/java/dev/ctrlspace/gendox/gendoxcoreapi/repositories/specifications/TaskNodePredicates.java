package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QTaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;

import java.util.List;
import java.util.UUID;

public class TaskNodePredicates {
    private static final QTaskNode qTaskNode = QTaskNode.taskNode;

    public static Predicate build(TaskNodeCriteria criteria) {
        return ExpressionUtils.allOf(
                taskIdEq(criteria.getTaskId()),
                nodeIds(criteria.getNodeIds()),
                nodeTypes(criteria.getNodeTypeNames())

        );
    }

    public static Predicate buildAnyNodeType(TaskNodeCriteria criteria) {
        return ExpressionUtils.anyOf(
                documentNodes(criteria.getTaskId(), criteria.getDocumentNodeIds()),
                questionNodes(criteria.getTaskId(), criteria.getQuestionNodeIds()),
                answerNodes(criteria.getTaskId(), criteria.getAnswerNodeIds())
        );
    }




    /* ---------- private helpers -------------------------------------------------------------- */

    private static Predicate documentNodes(UUID taskId, List<UUID> documentNodeIds) {
        if (documentNodeIds == null || documentNodeIds.isEmpty()) {
            return null;
        }
        return ExpressionUtils.allOf(
                taskIdEq(taskId),
                nodeTypes(List.of(TaskNodeTypeConstants.DOCUMENT)),
                qTaskNode.id.in(documentNodeIds)
        );
    }

    private static Predicate questionNodes(UUID taskId, List<UUID> questionNodeIds) {
        if (questionNodeIds == null || questionNodeIds.isEmpty()) {
            return null;
        }
        return ExpressionUtils.allOf(
                taskIdEq(taskId),
                nodeTypes(List.of(TaskNodeTypeConstants.QUESTION)),
                qTaskNode.id.in(questionNodeIds)
        );
    }

    public static Predicate answerNodes(UUID taskId, List<UUID> answerNodeIds) {
        if ((answerNodeIds == null || answerNodeIds.isEmpty()) && taskId == null) {
            return null;
        }

        return ExpressionUtils.allOf(
                taskIdEq(taskId),
                nodeTypes(List.of(TaskNodeTypeConstants.ANSWER)),
                qTaskNode.id.in(answerNodeIds)
        );
    }


    private static Predicate nodeIds(List<UUID> nodeIds) {
        if (nodeIds == null || nodeIds.isEmpty()) {
            return null;
        }
        return qTaskNode.id.in(nodeIds);
    }


    private static Predicate nodeTypes(List<String> nodeTypes) {
        if (nodeTypes == null || nodeTypes.isEmpty()) {
            return null;
        }
        return qTaskNode.nodeType.name.in(nodeTypes);
    }

    private static Predicate taskIdEq(UUID taskId) {
        if (taskId == null) {
            return null;
        }
        return qTaskNode.taskId.eq(taskId);
    }
}

