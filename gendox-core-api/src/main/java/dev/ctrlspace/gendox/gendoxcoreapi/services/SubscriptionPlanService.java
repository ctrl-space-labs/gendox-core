package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationPlan;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ApiRateLimitRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.SubscriptionPlanRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ApiRateLimitTypes;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.SubscriptionTypes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

@Service
public class SubscriptionPlanService {


    private ApiRateLimitRepository apiRateLimitRepository;

    private SubscriptionPlanRepository subscriptionPlanRepository;

    @Autowired
    public SubscriptionPlanService(ApiRateLimitRepository apiRateLimitRepository,
                                   SubscriptionPlanRepository subscriptionPlanRepository) {
        this.apiRateLimitRepository = apiRateLimitRepository;
        this.subscriptionPlanRepository = subscriptionPlanRepository;
    }


    /**
     * Creates the default free plan. this is cached for performance.
     * Cache is evicted every 5 minutes, no need to explicitly evict it for now.
     * @return the default free Organization Plan
     */
    @Cacheable(value = "OrganizationPlanService#createDefaultFreePlan")
    public OrganizationPlan createDefaultFreePlan() {
        OrganizationPlan plan = new OrganizationPlan();
        plan.setApiRateLimit(apiRateLimitRepository.findByTierTypeName(ApiRateLimitTypes.RATE_LIMIT_FREE));
        plan.setSubscriptionPlan(subscriptionPlanRepository.findBySkuTypeNameAndActiveIsTrue(SubscriptionTypes.SKU_TYPE_FREE));
        plan.setNumberOfSeats(1);
        Instant now = Instant.now();
        plan.setStartDate(now);
        plan.setEndDate(now.plus(Duration.ofDays(365)));
        return plan;
    }



}
