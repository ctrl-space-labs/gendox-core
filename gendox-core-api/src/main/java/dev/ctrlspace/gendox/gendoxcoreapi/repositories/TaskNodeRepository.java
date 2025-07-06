package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskNodeRepository extends JpaRepository<TaskNode, UUID>, QuerydslPredicateExecutor<TaskNode> {

    Page<TaskNode> findAllByTaskId(UUID taskId, Pageable pageable);

    @Query("SELECT tn FROM TaskNode tn WHERE tn.taskId = :taskId AND tn.nodeType.name = :nodeTypeName")
    List<TaskNode> findAllByTaskIdAndNodeTypeName(@Param("taskId") UUID taskId, @Param("nodeTypeName") String nodeTypeName);

    @Query("""
                select docNode, quesNode
                from TaskNode docNode, TaskNode quesNode
                where docNode.taskId = :taskId
                  and quesNode.taskId = :taskId
                  and docNode.nodeType.id = :documentNodeTypeId
                  and quesNode.nodeType.id = :questionNodeTypeId
                  and (:documentNodeIds is null or docNode.id in :documentNodeIds)
                  and (:questionNodeIds is null or quesNode.id in :questionNodeIds)
                order by docNode.createdAt asc, quesNode.createdAt asc
            """)
    List<Object[]> findDocumentQuestionPairsByCriteria(
            @Param("taskId") UUID taskId,
            @Param("documentNodeTypeId") Long documentNodeTypeId,
            @Param("questionNodeTypeId") Long questionNodeTypeId,
            @Param("documentNodeIds") List<UUID> documentNodeIds,
            @Param("questionNodeIds") List<UUID> questionNodeIds,
            Pageable pageable);


    @Query(value = """
            SELECT COUNT(*)
            FROM gendox_core.task_nodes docs
            CROSS JOIN gendox_core.task_nodes questions
            WHERE docs.task_id = :taskId
              AND questions.task_id = :taskId
              AND docs.node_type_id = :documentNodeTypeId
              AND questions.node_type_id = :questionNodeTypeId
            """, nativeQuery = true)
    long countDocumentQuestionPairs(
            @Param("taskId") UUID taskId,
            @Param("documentNodeTypeId") Long documentNodeTypeId,
            @Param("questionNodeTypeId") Long questionNodeTypeId);


    @Query("""
                select answerNode
                from TaskEdge edgeDoc
                join edgeDoc.fromNode answerNode
                join edgeDoc.toNode docNode
                join TaskEdge edgeQues on edgeQues.fromNode = answerNode
                join edgeQues.toNode quesNode
                where edgeDoc.relationType.name = 'ANSWERS'
                  and edgeQues.relationType.name = 'ANSWERS'
                  and answerNode.taskId = :taskId
                  and docNode.id = :documentNodeId
                  and quesNode.id = :questionNodeId
            """)
    Optional<TaskNode> findAnswerNodeByDocumentAndQuestion(
            @Param("taskId") UUID taskId,
            @Param("documentNodeId") UUID documentNodeId,
            @Param("questionNodeId") UUID questionNodeId);


}
