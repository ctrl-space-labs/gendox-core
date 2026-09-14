package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationPlan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationPlanRepository extends JpaRepository<OrganizationPlan, UUID>, QuerydslPredicateExecutor<OrganizationPlan> {


//    @EntityGraph(attributePaths = {"organization", "subscriptionPlan", "apiRateLimit"})
//    Page<OrganizationPlan> findAll(Predicate predicate, Pageable pageable);

    @Query("SELECT o.subscriptionPlan.id FROM OrganizationPlan o WHERE o.organization.id = :organizationId")
    UUID findSubscriptionPlanIdByOrganizationId(@Param("organizationId") UUID organizationId);

    List<OrganizationPlan> findAllByOrganizationId(UUID organizationId);

    @Query(value = """
            SELECT *
            FROM gendox_core.organization_plan
            WHERE organization_id = :organizationId
              AND end_date < :before
            ORDER BY end_date DESC
            LIMIT 1
            """, nativeQuery = true)
    Optional<OrganizationPlan> findMostRecentlyEndedPlan(@Param("organizationId") UUID organizationId,
                                                         @Param("before") Instant before);




}
