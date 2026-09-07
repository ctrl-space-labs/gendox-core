package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.SubscriptionNotificationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationPlanCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import io.micrometer.observation.annotation.Observed;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
public class SubscriptionPlansController {

    Logger logger = LoggerFactory.getLogger(SubscriptionPlansController.class);

    private OrganizationPlanService organizationPlanService;
    private SubscriptionPlanService subscriptionPlanService;
    private OrganizationService organizationService;
    private UserOrganizationService userOrganizationService;
    private UserService userService;


    @Autowired
    public SubscriptionPlansController(OrganizationPlanService organizationPlanService,
                                       SubscriptionPlanService subscriptionPlanService,
                                       OrganizationService organizationService,
                                       UserOrganizationService userOrganizationService,
                                       UserService userService) {
        this.organizationPlanService = organizationPlanService;
        this.subscriptionPlanService = subscriptionPlanService;
        this.organizationService = organizationService;
        this.userOrganizationService = userOrganizationService;
        this.userService = userService;
    }

    //    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_ORGANIZATION_PLAN', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("/organizations/{organizationId}/subscription-plans")
    public Page<SubscriptionPlan> getAllActivePlans(Pageable pageable) {
        return subscriptionPlanService.getAllActiveSubscriptionPlans(pageable);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_ORGANIZATION_PLAN', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("/organizations/{organizationId}/organization-plans")
    public OrganizationPlan getAllByCriteria(OrganizationPlanCriteria criteria, Pageable pageable, @PathVariable UUID organizationId) {
        criteria.setOrganizationId(organizationId);
        return organizationPlanService.getActiveOrganizationPlan(criteria.getOrganizationId());
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_ORGANIZATION_PLAN', 'getRequestedOrgIdFromPathVariable')")
    @PutMapping("/organizations/{organizationId}/organization-plans/{organizationPlanId}/cancel")
    public OrganizationPlan cancelOrganizationPlan(@PathVariable UUID organizationPlanId, @PathVariable UUID organizationId) throws GendoxException {
        return organizationPlanService.cancelOrganizationPlan(organizationPlanId);
    }


    @PreAuthorize("@securityUtils.isSuperAdmin()")
    @PostMapping("/organizations/{organizationId}/subscription-notifications")
    public OrganizationPlan createOrganizationPlanBySubscriptionNotification(@RequestBody SubscriptionNotificationDTO subscriptionNotificationDTO, @PathVariable UUID organizationId) throws GendoxException {
        Organization organization = organizationService.getById(organizationId);
        return organizationPlanService.upsertOrganizationPlan(subscriptionNotificationDTO, organization);
    }


    @PreAuthorize("@securityUtils.isSuperAdmin()")
    @PostMapping("/subscription-notifications")
    @Observed(name = "SubscriptionPlansController.createOrganizationPlanBySubscriptionNotification",
            contextualName = "SubscriptionPlansController#createOrganizationPlanBySubscriptionNotification",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "true"
            })
    public OrganizationPlan createOrganizationPlanBySubscriptionNotification(@RequestBody SubscriptionNotificationDTO subscriptionNotificationDTO) throws GendoxException {
        User user = userService.getByEmail(subscriptionNotificationDTO.getEmail());
        UserOrganization userOrganization = userOrganizationService.getUserOrganizationByOwnerId(user.getId());

        Organization organization;
        if (userOrganization == null) {
            Organization newOrganization = new Organization();
            newOrganization.setName("Default Organization");
            organization = organizationService.createOrganization(newOrganization, user.getId());

            logger.info("No organization found for user with email={}, created new organization with id={}",
                    subscriptionNotificationDTO.getEmail(), organization.getId());
        } else {
            organization = userOrganization.getOrganization();
        }

        OrganizationPlan organizationPlan = organizationPlanService.upsertOrganizationPlan(subscriptionNotificationDTO, organization);

        logger.info("Successfully processed subscription for organizationId={}, organizationPlanId={}, email={}, productSKU={}, status={}",
                organization.getId(),
                organizationPlan.getId(),
                subscriptionNotificationDTO.getEmail(),
                subscriptionNotificationDTO.getProductSKU(),
                subscriptionNotificationDTO.getStatus());

        return organizationPlan;
    }


}
