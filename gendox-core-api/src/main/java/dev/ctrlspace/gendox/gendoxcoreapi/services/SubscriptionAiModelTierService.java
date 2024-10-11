package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.SubscriptionAiModelTierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class SubscriptionAiModelTierService {

    private SubscriptionAiModelTierRepository subscriptionAiModelTierRepository;


    @Autowired
    public SubscriptionAiModelTierService(SubscriptionAiModelTierRepository subscriptionAiModelTierRepository) {
        this.subscriptionAiModelTierRepository = subscriptionAiModelTierRepository;


    }

    public boolean hasAccessToModelTier(UUID subscriptionPlanId, Long aiModelTierId) {
        return subscriptionAiModelTierRepository.existsBySubscriptionPlanIdAndAiModelTierId(subscriptionPlanId, aiModelTierId);
    }






}
