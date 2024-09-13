package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationPlan;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationPlanCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationPlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.UUID;

@RestController
public class OrganizationPlanController {

    private OrganizationPlanService organizationPlanService;

    @Autowired
    public OrganizationPlanController(OrganizationPlanService organizationPlanService) {
        this.organizationPlanService = organizationPlanService;
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_ORGANIZATION_PLAN', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("/organizations/{organizationId}/organization-plans")
    public Page<OrganizationPlan> getAllByCriteria(OrganizationPlanCriteria criteria, Pageable pageable, @PathVariable UUID organizationId) {

        criteria.setOrganizationId(organizationId);

        if (criteria.getActiveAtDate() == null) {
            criteria.setActiveAtDate(Instant.now());
        }

        return organizationPlanService.getAllOrganizationPlansByCriteria(criteria, pageable);
    }


}
