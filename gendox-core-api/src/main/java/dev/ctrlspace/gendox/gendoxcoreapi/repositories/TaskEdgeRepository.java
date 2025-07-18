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
    @Query("DELETE FROM TaskEdge e WHERE e.id IN :ids")
    void deleteAllByIds(@Param("ids") List<UUID> ids);

    List<TaskEdge> findAllByRelationTypeAndToNodeIdIn(Type relationType, List<UUID> toNodeIds);
    List<TaskEdge> findAllByFromNodeIdIn(List<UUID> fromNodeIds);
    List<TaskEdge> findAllByToNodeIdIn(List<UUID> toNodeIds);

    @Query("SELECT e.id FROM TaskEdge e WHERE e.fromNode.id IN :fromNodeIds")
    List<UUID> findIdsByFromNodeIdIn(@Param("fromNodeIds") List<UUID> fromNodeIds);



}
