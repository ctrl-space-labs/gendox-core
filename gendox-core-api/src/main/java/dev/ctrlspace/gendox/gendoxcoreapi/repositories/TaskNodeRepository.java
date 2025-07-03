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
import java.util.UUID;

@Repository
public interface TaskNodeRepository extends JpaRepository<TaskNode, UUID>, QuerydslPredicateExecutor<TaskNode> {

    Page<TaskNode> findAllByTaskId(UUID taskId, Pageable pageable);

    @Query("SELECT tn FROM TaskNode tn WHERE tn.taskId = :taskId AND tn.nodeType.name = :nodeTypeName")
    List<TaskNode> findAllByTaskIdAndNodeTypeName(@Param("taskId") UUID taskId, @Param("nodeTypeName") String nodeTypeName);

}
