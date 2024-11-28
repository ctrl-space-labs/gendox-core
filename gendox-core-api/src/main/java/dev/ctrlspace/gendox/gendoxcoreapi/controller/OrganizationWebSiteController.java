package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationWebSite;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.OrganizationWebSiteDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.WebsiteIntegrationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationWebSiteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class OrganizationWebSiteController {

    private OrganizationWebSiteService organizationWebSiteService;

    @Autowired
    public OrganizationWebSiteController(OrganizationWebSiteService organizationWebSiteService) {
        this.organizationWebSiteService = organizationWebSiteService;
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_ORGANIZATION_WEB_SITES', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("/organizations/{organizationId}/websites")
    public List<OrganizationWebSite> getAllByOrganizationId(@PathVariable UUID organizationId) {
        return organizationWebSiteService.getAllByOrganizationId(organizationId);

    }

    /**
     * Integrate an organization website with a third-party service
     *
     * @param websiteIntegrationDTO
     */
    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_WEB_SITES', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("/organizations/{organizationId}/websites/integration")
    public void integrateOrganizationWebSite(@PathVariable UUID organizationId, @RequestBody WebsiteIntegrationDTO websiteIntegrationDTO) throws GendoxException {

        organizationWebSiteService.integrateOrganizationWebSite(organizationId, websiteIntegrationDTO);

    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_WEB_SITES', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("/organizations/{organizationId}/websites")
    public OrganizationWebSite createOrganizationWebSite(@PathVariable UUID organizationId,
                                                         @RequestBody OrganizationWebSiteDTO organizationWebSiteDTO) {

        return organizationWebSiteService.createOrganizationWebSite(organizationWebSiteDTO, organizationId);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_WEB_SITES', 'getRequestedOrgIdFromPathVariable')")
    @PutMapping("/organizations/{organizationId}/websites/{websiteId}")
    public OrganizationWebSite updateOrganizationWebSite(@PathVariable UUID organizationId,
                                                         @PathVariable UUID websiteId,
                                                         @RequestBody OrganizationWebSiteDTO organizationWebSiteDTO) {

        return organizationWebSiteService.updateOrganizationWebSite(websiteId, organizationWebSiteDTO);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_WEB_SITES', 'getRequestedOrgIdFromPathVariable')")
    @DeleteMapping("/organizations/{organizationId}/websites/{websiteId}")
    public void deleteOrganizationWebSite(@PathVariable UUID organizationId, @PathVariable UUID websiteId) {
        organizationWebSiteService.deleteOrganizationWebSite(websiteId);
    }


}
