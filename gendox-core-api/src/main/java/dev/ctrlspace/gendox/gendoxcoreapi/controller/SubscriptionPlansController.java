package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.SubscriptionNotificationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationPlanCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@RestController
public class SubscriptionPlansController {

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


    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_ORGANIZATION_PLAN', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("/organizations/{organizationId}/subscription-notifications")
    public OrganizationPlan createOrganizationPlanBySubscriptionNotification(@RequestBody SubscriptionNotificationDTO subscriptionNotificationDTO, @PathVariable UUID organizationId) throws GendoxException {
        Organization organization = organizationService.getById(organizationId);
        return organizationPlanService.upsertOrganizationPlan(subscriptionNotificationDTO, organization);
    }


    @PostMapping("/subscription-notifications")
    public OrganizationPlan createOrganizationPlanBySubscriptionNotification(@RequestBody SubscriptionNotificationDTO subscriptionNotificationDTO) throws GendoxException {

        User user = userService.getByEmail(subscriptionNotificationDTO.getEmail());
        List<UserOrganization> userOrganizations = userOrganizationService.getUserOrganizationsByUserId(user.getId().toString());
        // Ensure the user belongs to at least one organization
        if (userOrganizations == null || userOrganizations.isEmpty()) {
            throw new GendoxException("NO_ORGANIZATION_FOUND", "User does not belong to any organization", HttpStatus.BAD_REQUEST);
        }
        Organization organization = userOrganizations.getFirst().getOrganization();
        return organizationPlanService.upsertOrganizationPlan(subscriptionNotificationDTO, organization);
    }


}
