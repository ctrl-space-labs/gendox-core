package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskEdge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TaskEdgeRepository extends JpaRepository<TaskEdge, UUID>, QuerydslPredicateExecutor<TaskEdge> {



}
