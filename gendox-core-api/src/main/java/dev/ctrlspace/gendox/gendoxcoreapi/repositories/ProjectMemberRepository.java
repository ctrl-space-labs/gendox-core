package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectMember;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;

import java.util.List;
import java.util.UUID;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID>, QuerydslPredicateExecutor<ProjectMember> {
//    bollean existsByUserAndProject(User user, Project project);

    public List<ProjectMember> findByProjectId(UUID projectId);

    List<ProjectMember> findByUserId(UUID userId);

    @Query("SELECT pm FROM ProjectMember pm WHERE pm.project.id = :projectId AND pm.user.id = :userId")
    ProjectMember findByProjectIdAndUserId(UUID projectId, UUID userId);

    //   public ProjectMember findByProjectId(UUID projectId);

    boolean existsByProjectIdAndUserId(UUID projectId, UUID userId);

}
