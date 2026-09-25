package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.Expression;
import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Predicate;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.core.types.dsl.SimpleExpression;
import com.querydsl.core.types.dsl.StringExpression;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.JPQLQuery;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QDocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QTaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;

import java.util.List;
import java.util.UUID;

public class TaskNodePredicates {
    private static final QTaskNode qTaskNode = QTaskNode.taskNode;
    private static final QDocumentInstance qDocument = QDocumentInstance.documentInstance;

    /**
     * ((node_value ->> 'order')::int) — exposed so it can be reused as a
     * lightweight projection (e.g. selecting only page numbers) instead of
     * always fetching full {@code TaskNode} entities.
     */
    public static NumberExpression<Integer> nodeOrder() {
        return Expressions.numberTemplate(
                Integer.class,
                "cast(function('jsonb_extract_path_text', {0}, {1}) as int)",
                qTaskNode.nodeValue,
                Expressions.constant("order")
        );
    }

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
                pageTo(criteria.getPageTo()),
                documentNameContains(criteria.getDocumentNameContains()),
                answerStatus(criteria),
                answerValue(criteria)
        );
    }

    /** The lower-cased title of a DOCUMENT node's document, to sort by. */
    public static Expression<String> documentTitle() {
        return JPAExpressions.select(qDocument.title.lower())
                .from(qDocument)
                .where(qDocument.id.eq(qTaskNode.documentId));
    }

    /** The lower-cased answer value of a DOCUMENT node for a question, to sort by. */
    public static Expression<String> answerValue(UUID questionNodeId) {
        QTaskNode answer = new QTaskNode("sortAnswer");
        return answersOf(answer, questionNodeId, nodeValueText(answer, "answerValue").lower().max());
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

    private static Predicate documentNameContains(String documentNameContains) {
        if (documentNameContains == null || documentNameContains.isBlank()) {
            return null;
        }
        return JPAExpressions.selectOne()
                .from(qDocument)
                .where(qDocument.id.eq(qTaskNode.documentId),
                        qDocument.title.containsIgnoreCase(documentNameContains.trim()))
                .exists();
    }

    /**
     * DOCUMENT nodes whose answer to answerFilterQuestionNodeId has one of answerFilterStatuses.
     * EXISTS is never null, so with answerFilterNegate a document with no answer counts as "not OK".
     */
    private static Predicate answerStatus(TaskNodeCriteria criteria) {
        UUID questionNodeId = criteria.getAnswerFilterQuestionNodeId();
        List<String> statuses = criteria.getAnswerFilterStatuses();
        if (questionNodeId == null || statuses == null || statuses.isEmpty()) {
            return null;
        }

        List<String> flags = statuses.stream().filter(status -> !TaskNodeCriteria.UNANSWERED.equals(status)).toList();
        QTaskNode flaggedAnswer = new QTaskNode("flaggedAnswer");
        BooleanExpression hasFlag = flags.isEmpty() ? null
                : answersOf(flaggedAnswer, questionNodeId, Expressions.ONE)
                .where(nodeValueText(flaggedAnswer, "answerFlagEnum").in(flags))
                .exists();
        BooleanExpression unanswered = statuses.contains(TaskNodeCriteria.UNANSWERED)
                ? answersOf(new QTaskNode("anyAnswer"), questionNodeId, Expressions.ONE).notExists()
                : null;

        Predicate match = ExpressionUtils.anyOf(hasFlag, unanswered);
        return Boolean.TRUE.equals(criteria.getAnswerFilterNegate()) ? match.not() : match;
    }

    /** DOCUMENT nodes whose answer value matches one of the selected decision results. */
    private static Predicate answerValue(TaskNodeCriteria criteria) {
        UUID questionNodeId = criteria.getAnswerFilterQuestionNodeId();
        List<String> values = criteria.getAnswerFilterValues();
        if (questionNodeId == null || values == null || values.isEmpty()) {
            return null;
        }

        List<String> answeredValues = values.stream()
                .filter(value -> value != null
                        && !value.isBlank()
                        && !TaskNodeCriteria.UNANSWERED.equals(value))
                .toList();
        boolean includeUnanswered = values.contains(TaskNodeCriteria.UNANSWERED);
        if (answeredValues.isEmpty() && !includeUnanswered) {
            return null;
        }
        QTaskNode matchingAnswer = new QTaskNode("matchingAnswer");
        StringExpression storedValue = nodeValueText(matchingAnswer, "answerValue");
        BooleanExpression valueMatch = answeredValues.stream()
                .map(value -> Boolean.TRUE.equals(criteria.getAnswerFilterValuePrefix())
                        ? storedValue.eq(value).or(storedValue.startsWith(value + " ("))
                        : storedValue.eq(value))
                .reduce(BooleanExpression::or)
                .orElse(null);
        BooleanExpression hasValue = valueMatch == null ? null
                : answersOf(matchingAnswer, questionNodeId, Expressions.ONE).where(valueMatch).exists();
        BooleanExpression unanswered = includeUnanswered
                ? answersOf(new QTaskNode("anyDecisionAnswer"), questionNodeId, Expressions.ONE).notExists()
                : null;

        Predicate match = ExpressionUtils.anyOf(hasValue, unanswered);
        return Boolean.TRUE.equals(criteria.getAnswerFilterNegate()) ? match.not() : match;
    }

    /** The ANSWER nodes of the current DOCUMENT node for one question. */
    private static <T> JPQLQuery<T> answersOf(QTaskNode answer, UUID questionNodeId, Expression<T> select) {
        return JPAExpressions.select(select)
                .from(answer)
                .where(answer.taskId.eq(qTaskNode.taskId),
                        answer.nodeType.name.eq(TaskNodeTypeConstants.ANSWER),
                        nodeValueText(answer, "nodeDocumentId").eq(Expressions.stringTemplate("str({0})", qTaskNode.id)),
                        nodeValueText(answer, "nodeQuestionId").eq(questionNodeId.toString()));
    }

    /**
     * node_value ->> key, as text. The key is written into the SQL (not bound as a parameter)
     * and ids are compared as text, so the answer lookup index on these expressions can be used.
     */
    private static StringExpression nodeValueText(QTaskNode node, String key) {
        return Expressions.stringTemplate("function('jsonb_extract_path_text', {0}, '" + key + "')", node.nodeValue);
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

        return nodeOrder().goe(pageFrom);
    }

    public static Predicate pageTo(Integer pageTo) {
        if (pageTo == null) {
            return null;
        }

        return nodeOrder().loe(pageTo);
    }
}
