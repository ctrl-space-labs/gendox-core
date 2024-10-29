package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationPlan;
import dev.ctrlspace.gendox.gendoxcoreapi.model.SubscriptionPlan;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationPlanCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationPlanService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.SubscriptionPlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.UUID;

@RestController
public class SubscriptionPlansController {

    private OrganizationPlanService organizationPlanService;
    private SubscriptionPlanService subscriptionPlanService;

    @Autowired
    public SubscriptionPlansController(OrganizationPlanService organizationPlanService,
                                       SubscriptionPlanService subscriptionPlanService) {
        this.organizationPlanService = organizationPlanService;
        this.subscriptionPlanService = subscriptionPlanService;
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
    public OrganizationPlan cancelSubscriptionPlan(@PathVariable UUID organizationPlanId, @PathVariable UUID organizationId) throws GendoxException {
        return organizationPlanService.cancelSubscriptionPlan(organizationPlanId);
    }


}
