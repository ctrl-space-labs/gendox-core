package dev.ctrlspace.gendox.gendoxcoreapi.repositories;


import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ProjectAgentRepository extends JpaRepository<ProjectAgent, UUID>, QuerydslPredicateExecutor<ProjectAgent> {

    ProjectAgent findByProjectId(UUID projectId);

}
