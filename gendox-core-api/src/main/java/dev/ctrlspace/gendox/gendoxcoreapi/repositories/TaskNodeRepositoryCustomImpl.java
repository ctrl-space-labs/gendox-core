package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import com.querydsl.core.Tuple;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QTaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeValueDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.TaskNodePredicates;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
@Transactional(readOnly = true)
public class TaskNodeRepositoryCustomImpl implements TaskNodeRepositoryCustom {

    private static final Logger logger = LoggerFactory.getLogger(TaskNodeRepositoryCustomImpl.class);

    private final JPAQueryFactory queryFactory;

    @Autowired
    public TaskNodeRepositoryCustomImpl(JPAQueryFactory queryFactory) {
        this.queryFactory = queryFactory;
    }

    @Override
    public List<TaskNode> findExistingAnswerNodesLite(TaskNodeCriteria criteria) {
        logger.trace("Fetching existing answer nodes (lite) by criteria: {}", criteria);
        QTaskNode qTaskNode = QTaskNode.taskNode;
        NumberExpression<Integer> orderExpr = TaskNodePredicates.nodeOrder();

        List<Tuple> rows = queryFactory
                .select(qTaskNode.id, qTaskNode.nodeType.name, orderExpr)
                .from(qTaskNode)
                .where(TaskNodePredicates.build(criteria))
                .fetch();

        return rows.stream()
                .map(row -> {
                    TaskNode node = new TaskNode();
                    node.setId(row.get(qTaskNode.id));

                    Type nodeType = new Type();
                    nodeType.setName(row.get(qTaskNode.nodeType.name));
                    node.setNodeType(nodeType);

                    node.setNodeValue(TaskNodeValueDTO.builder().order(row.get(orderExpr)).build());
                    return node;
                })
                .toList();
    }
}
