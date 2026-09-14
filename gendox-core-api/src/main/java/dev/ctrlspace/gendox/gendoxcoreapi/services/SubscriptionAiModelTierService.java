package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.SubscriptionAiModelTierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class SubscriptionAiModelTierService {

    private SubscriptionAiModelTierRepository subscriptionAiModelTierRepository;
    private OrganizationPlanService organizationPlanService;


    @Autowired
    public SubscriptionAiModelTierService(SubscriptionAiModelTierRepository subscriptionAiModelTierRepository,
                                          OrganizationPlanService organizationPlanService) {
        this.subscriptionAiModelTierRepository = subscriptionAiModelTierRepository;
        this.organizationPlanService = organizationPlanService;


    }

    public boolean hasAccessToModelTier(UUID subscriptionPlanId, Long aiModelTierId) {
        return subscriptionAiModelTierRepository.existsBySubscriptionPlanIdAndAiModelTierId(subscriptionPlanId, aiModelTierId);
    }

    // true when the active plan of the organization grants access to the model's tier
    public boolean hasAccessToModel(UUID organizationId, AiModel model) {
        UUID subscriptionPlanId = organizationPlanService.getActiveOrganizationPlan(organizationId).getSubscriptionPlan().getId();
        return hasAccessToModelTier(subscriptionPlanId, model.getModelTierType().getId());
    }






}
