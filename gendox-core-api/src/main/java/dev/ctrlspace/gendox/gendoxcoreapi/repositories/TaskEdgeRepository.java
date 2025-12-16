package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskEdge;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskEdgeRepository extends JpaRepository<TaskEdge, UUID>, QuerydslPredicateExecutor<TaskEdge> {

    @Modifying
    @Transactional
    @Query(nativeQuery = true,
            value = "DELETE FROM gendox_core.task_edges e WHERE e.id IN :ids")
    void deleteAllByIds(@Param("ids") List<UUID> ids);

    @Query("select e.id from TaskEdge e where e.fromNode.id in :fromNodeIds")
    List<UUID> findAllIdsByFromNodeIdIn(@Param("fromNodeIds") List<UUID> fromNodeIds);
    List<TaskEdge> findAllByFromNodeIdIn(List<UUID> fromNodeIds);

    @Query("select e.id from TaskEdge e where e.toNode.id in :toNodeIds")
    List<UUID> findAllIdsByToNodeIdIn(@Param("toNodeIds") List<UUID> toNodeIds);
    List<TaskEdge> findAllByToNodeIdIn(List<UUID> toNodeIds);



}
