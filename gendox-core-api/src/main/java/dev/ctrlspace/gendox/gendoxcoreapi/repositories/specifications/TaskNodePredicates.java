package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.core.types.dsl.SimpleExpression;
import com.querydsl.core.types.dsl.StringExpression;
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
                nodeTypes(criteria.getNodeTypeNames()),
                nodeValueNodeDocumentId(criteria.getNodeValueNodeDocumentId()),
                nodeValueNodeQuestionIds(criteria.getQuestionNodeIds()),
                nodeValueNodeDocumentIds(criteria.getDocumentNodeIds()),
                nodeValueNodeAnswerIds(criteria.getAnswerNodeIds()),
                pageFrom(criteria.getPageFrom()),
                pageTo(criteria.getPageTo())

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

    private static Predicate nodeValueNodeDocumentId(UUID nodeDocumentId) {
        if (nodeDocumentId == null) return null;

        //  ((node_value ->> 'nodeDocumentId')::uuid)
        SimpleExpression<UUID> docIdUuid =
                Expressions.template(
                        UUID.class,                                        // Java type
                        "cast(function('jsonb_extract_path_text', {0}, {1}) as uuid)",
                        qTaskNode.nodeValue,
                        Expressions.constant("nodeDocumentId")
                );

        // Now eq(UUID) is available
        return docIdUuid.eq(nodeDocumentId);
    }

    private static Predicate nodeValueNodeQuestionIds(List<UUID> questionNodeIds) {
        if (questionNodeIds == null || questionNodeIds.isEmpty()) {
            return null;
        }

        //  ((node_value ->> 'nodeQuestionId')::uuid)
        SimpleExpression<UUID> questionIdUuid =
                Expressions.template(
                        UUID.class,                                        // Java type
                        "cast(function('jsonb_extract_path_text', {0}, {1}) as uuid)",
                        qTaskNode.nodeValue,
                        Expressions.constant("nodeQuestionId")
                );

        return questionIdUuid.in(questionNodeIds);
    }

    private static Predicate nodeValueNodeDocumentIds(List<UUID> documentNodeIds) {
        if (documentNodeIds == null || documentNodeIds.isEmpty()) {
            return null;
        }

        //  ((node_value ->> 'nodeDocumentId')::uuid)
        SimpleExpression<UUID> docIdUuid =
                Expressions.template(
                        UUID.class,                                        // Java type
                        "cast(function('jsonb_extract_path_text', {0}, {1}) as uuid)",
                        qTaskNode.nodeValue,
                        Expressions.constant("nodeDocumentId")
                );

        return docIdUuid.in(documentNodeIds);
    }

    private static Predicate nodeValueNodeAnswerIds(List<UUID> answerNodeIds) {
        if (answerNodeIds == null || answerNodeIds.isEmpty()) {
            return null;
        }

        //  ((node_value ->> 'nodeAnswerId')::uuid)
        SimpleExpression<UUID> answerIdUuid =
                Expressions.template(
                        UUID.class,                                        // Java type
                        "cast(function('jsonb_extract_path_text', {0}, {1}) as uuid)",
                        qTaskNode.nodeValue,
                        Expressions.constant("nodeAnswerId")
                );

        return answerIdUuid.in(answerNodeIds);
    }

    private static Predicate taskIdEq(UUID taskId) {
        if (taskId == null) {
            return null;
        }
        return qTaskNode.taskId.eq(taskId);
    }

    private static Predicate pageFrom(Integer pageFrom) {
        if (pageFrom == null) {
            return null;
        }

        //  ((node_value ->> 'order')::int)
        NumberExpression<Integer> orderInt = Expressions.numberTemplate(
                Integer.class,
                "cast(function('jsonb_extract_path_text', {0}, {1}) as int)",
                qTaskNode.nodeValue,
                Expressions.constant("order")
        );

        return orderInt.goe(pageFrom);
    }

    public static Predicate pageTo(Integer pageTo) {
        if (pageTo == null) {
            return null;
        }

        //  ((node_value ->> 'order')::int)
        NumberExpression<Integer> orderInt = Expressions.numberTemplate(
                Integer.class,
                "cast(function('jsonb_extract_path_text', {0}, {1}) as int)",
                qTaskNode.nodeValue,
                Expressions.constant("order")
        );

        return orderInt.loe(pageTo);
    }
}

