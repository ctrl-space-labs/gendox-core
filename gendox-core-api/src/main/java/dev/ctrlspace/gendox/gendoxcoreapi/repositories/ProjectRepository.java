package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID>, QuerydslPredicateExecutor<Project> {

    @Query("SELECT p FROM Project p WHERE p.name = :name")
    Project findByName(@Param("name") String name);

    @Query("SELECT p.id FROM Project p WHERE p.name = :name")
    UUID findIdByName(@Param("name") String name);


    @EntityGraph(attributePaths = {"projectAgent"})
    Page<Project> findAll(Predicate predicate, Pageable pageable);





}
