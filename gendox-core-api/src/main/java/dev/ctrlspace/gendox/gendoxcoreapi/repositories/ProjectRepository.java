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

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID>, QuerydslPredicateExecutor<Project> {

    @Query("SELECT p FROM Project p WHERE p.name = :name")
    Project findByName(@Param("name") String name);

    @Query("SELECT p.id FROM Project p WHERE p.name = :name")
    UUID findIdByName(@Param("name") String name);


    @EntityGraph(attributePaths = {"projectAgent"})
    Page<Project> findAll(Predicate predicate, Pageable pageable);

    // aiTools fetched eagerly: the project is used by completions on async threads, outside the loading session
    @EntityGraph(attributePaths = {"projectAgent", "projectAgent.aiTools"}, type = EntityGraph.EntityGraphType.LOAD)
    Optional<Project> findById(UUID id);

    @Query(value = "SELECT COUNT(*) FROM gendox_core.projects WHERE organization_id = :organizationId AND is_active = TRUE", nativeQuery = true)
    long countActiveProjectsByOrganizationId(@Param("organizationId") UUID organizationId);

    long countByIdInAndOrganizationId(Collection<UUID> projectIds, UUID organizationId);


    // [projectId, documentCount, memberCount] for each active project of an organization, in one query
    @Query(value = """
            SELECT p.id,
                   (SELECT count(*) FROM gendox_core.project_documents pd WHERE pd.project_id = p.id),
                   (SELECT count(*) FROM gendox_core.project_members pm
                        JOIN gendox_core.users u ON u.id = pm.user_id
                        JOIN gendox_core.types t ON t.id = u.users_type_id
                    WHERE pm.project_id = p.id AND t.name <> 'GENDOX_AGENT')
            FROM gendox_core.projects p
            WHERE p.organization_id = :organizationId AND p.is_active = true
            """, nativeQuery = true)
    List<Object[]> findStatisticsByOrganizationId(@Param("organizationId") UUID organizationId);


}
