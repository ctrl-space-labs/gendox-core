package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectMember;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import com.querydsl.core.types.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID>, QuerydslPredicateExecutor<ProjectMember> {

    @EntityGraph(attributePaths = {"user", "user.userType"})
    Page<ProjectMember> findAll(Predicate predicate, Pageable pageable);

//    bollean existsByUserAndProject(User user, Project project);

    public List<ProjectMember> findByProjectId(UUID projectId);

    List<ProjectMember> findByUserId(UUID userId);

    @Query("SELECT pm FROM ProjectMember pm WHERE pm.project.id = :projectId AND pm.user.id = :userId")
    ProjectMember findByProjectIdAndUserId(UUID projectId, UUID userId);

    //   public ProjectMember findByProjectId(UUID projectId);

    boolean existsByProjectIdAndUserId(UUID projectId, UUID userId);

    long countByUserId(UUID userId);

    List<ProjectMember> findByUserIdAndProject_OrganizationId(UUID userId, UUID organizationId);

    // [projectId, count] of the people in each project, without the agents' own users, as the Members screen lists them
    @Query("SELECT pm.project.id, COUNT(pm) FROM ProjectMember pm " +
            "WHERE pm.project.id IN :projectIds AND pm.user.userType.name <> 'GENDOX_AGENT' GROUP BY pm.project.id")
    List<Object[]> countGroupedByProjectIds(@Param("projectIds") Set<UUID> projectIds);

}
