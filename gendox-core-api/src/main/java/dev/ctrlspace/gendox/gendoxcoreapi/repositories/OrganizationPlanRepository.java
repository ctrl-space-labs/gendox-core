package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationPlan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;

import java.util.UUID;

public interface OrganizationPlanRepository extends JpaRepository<OrganizationPlan, UUID>, QuerydslPredicateExecutor<OrganizationPlan> {


//    @EntityGraph(attributePaths = {"organization", "subscriptionPlan", "apiRateLimit"})
//    Page<OrganizationPlan> findAll(Predicate predicate, Pageable pageable);



}
