package dev.ctrlspace.gendox.gendoxcoreapi.repositories;


import dev.ctrlspace.gendox.gendoxcoreapi.model.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;

import java.util.UUID;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, UUID> {

    SubscriptionPlan findBySkuAndActiveIsTrue(String sku);

    Page<SubscriptionPlan> findAllByActiveTrue(Pageable pageable);

}
