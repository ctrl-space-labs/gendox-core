package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import org.springframework.data.repository.query.Param;

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

import java.util.Collection;
import java.util.List;
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

    /**
     * A member of an agent that still exists: the membership, the agent active and its organization active. A deleted
     * agent or organization keeps no one in, even where a membership was left behind.
     */
    @Query("""
            SELECT COUNT(pm) > 0 FROM ProjectMember pm, Organization o
            WHERE pm.project.id = :projectId AND pm.user.id = :userId
              AND o.id = pm.project.organizationId
              AND (pm.project.isActive IS NULL OR pm.project.isActive = TRUE)
              AND (o.isActive IS NULL OR o.isActive = TRUE)
            """)
    boolean existsActiveMembership(@Param("projectId") UUID projectId, @Param("userId") UUID userId);

    /** Which of these users are members of the agent: the others are left out. */
    @Query("SELECT pm.user.id FROM ProjectMember pm WHERE pm.project.id = :projectId AND pm.user.id IN :userIds")
    List<UUID> findMemberIdsAmong(@Param("projectId") UUID projectId, @Param("userIds") Collection<UUID> userIds);

    long countByUserId(UUID userId);

    List<ProjectMember> findByUserIdAndProject_OrganizationId(UUID userId, UUID organizationId);

}
