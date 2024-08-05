package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;

import java.util.UUID;

public interface OrganizationPlanRepository extends JpaRepository<OrganizationPlan, UUID>, QuerydslPredicateExecutor<OrganizationPlan> {




}
