package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationPlan;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.SubscriptionNotificationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ApiRateLimitService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.SubscriptionPlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class SubscriptionNotificationConverter {

    private SubscriptionPlanService subscriptionPlanService;
    private ApiRateLimitService apiRateLimitService;

    @Autowired
    public SubscriptionNotificationConverter(SubscriptionPlanService subscriptionPlanService,
                                             ApiRateLimitService apiRateLimitService) {
        this.subscriptionPlanService = subscriptionPlanService;
        this.apiRateLimitService = apiRateLimitService;
    }

    public OrganizationPlan convertToOrganizationPlan(SubscriptionNotificationDTO subscriptionNotificationDTO) throws GendoxException {
        OrganizationPlan organizationPlan = new OrganizationPlan();

        if (subscriptionNotificationDTO.getProductSKU() != null) {
            organizationPlan.setSubscriptionPlan(
                    subscriptionPlanService.getSubscriptionPlanBySku(subscriptionNotificationDTO.getProductSKU()));
        }

        if (subscriptionNotificationDTO.getStartDate() != null) {
            organizationPlan.setStartDate(subscriptionNotificationDTO.getStartDate());
        }

        if (subscriptionNotificationDTO.getEndDate() != null) {
            organizationPlan.setEndDate(subscriptionNotificationDTO.getEndDate());
        }

        if (subscriptionNotificationDTO.getNumberOfSeats() != null) {
            organizationPlan.setNumberOfSeats(subscriptionNotificationDTO.getNumberOfSeats());
        }

        if (subscriptionNotificationDTO.getApiRateLimitType() != null) {
            organizationPlan.setApiRateLimit(
                    apiRateLimitService.getApiRateLimitByTierType(subscriptionNotificationDTO.getApiRateLimitType()));
        }


        return organizationPlan;

    }


}
