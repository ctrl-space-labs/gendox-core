package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;
import java.util.UUID;

@Repository
public interface TaskNodeRepository extends JpaRepository<TaskNode, UUID>, QuerydslPredicateExecutor<TaskNode> {

    Page<TaskNode> findAllByTaskId(UUID taskId, Pageable pageable);

}
