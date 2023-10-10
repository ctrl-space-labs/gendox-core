package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Embedding;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID>, QuerydslPredicateExecutor<Project> {

    Project findByName(@Param("name") String name);
    @Query("SELECT p.id FROM Project p WHERE p.name = :name")
    UUID findIdByName(@Param("name") String name);
//
//    @EntityGraph(value = "project-with-related-entities", type = EntityGraph.EntityGraphType.LOAD)
//        @Query(nativeQuery = true, value = "SELECT emb.* FROM gendox_core.embedding emb " +
//                "INNER JOIN gendox_core.embedding_group eg ON emb.id = eg.embedding_id " +
//                "INNER JOIN gendox_core.document_instance_sections sec ON eg.section_id = sec.id " +
//                "INNER JOIN gendox_core.document_instance di ON di.id = sec.document_instance_id " +
//                "INNER JOIN gendox_core.project_documents pd ON di.id = pd.document_id " +
//                "WHERE pd.project_id = :projectId AND eg.section_id IS NOT NULL " +
//                "ORDER BY emb.embedding_vector <-> cast(:embedding as vector) LIMIT :pageSize")
//    List<Embedding> findClosestSections(@Param("projectId") UUID projectId, @Param("embedding") String embedding, @Param("pageSize") int pageSize);
//




}
