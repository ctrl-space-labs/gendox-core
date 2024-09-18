package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.SubscriptionAiModelTier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SubscriptionAiModelTierRepository extends JpaRepository<SubscriptionAiModelTier, UUID> {


    boolean existsBySubscriptionPlanIdAndAiModelTierId(UUID subscriptionPlanId, Long aiModelTierId);
}
