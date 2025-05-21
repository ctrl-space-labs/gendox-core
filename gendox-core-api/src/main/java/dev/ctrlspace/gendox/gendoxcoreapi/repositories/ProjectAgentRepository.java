package dev.ctrlspace.gendox.gendoxcoreapi.repositories;


import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectAgentRepository extends JpaRepository<ProjectAgent, UUID>, QuerydslPredicateExecutor<ProjectAgent> {

    @EntityGraph(attributePaths = {"project", "semanticSearchModel", "completionModel, aiTools"})
    ProjectAgent findByProjectId(UUID projectId);

    //is public agent
    Boolean existsByProjectIdAndPrivateAgentIsFalse(UUID projectId);

    @Query("SELECT pa FROM ProjectAgent pa JOIN pa.project p JOIN p.projectDocuments pd WHERE pd.documentId = :documentInstanceId")
    Optional<ProjectAgent> findAgentByDocumentInstanceId(@Param("documentInstanceId") UUID documentInstanceId);


}
