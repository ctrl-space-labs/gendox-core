package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskEdge;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskEdgeRepository extends JpaRepository<TaskEdge, UUID>, QuerydslPredicateExecutor<TaskEdge> {

    List<TaskEdge> findAllByRelationTypeAndToNodeIdIn(Type relationType, List<UUID> toNodeIds);
    List<TaskEdge> findAllByFromNodeIdIn(List<UUID> fromNodeIds);
    List<TaskEdge> findAllByToNodeIdIn(List<UUID> toNodeIds);

}
