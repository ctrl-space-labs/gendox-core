package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.authentication.ApiKeyAuthenticationToken;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationWebSite;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.OrganizationWebSiteDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.WebScrapeSourceDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.WebsiteIntegrationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationWebSiteService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.WebScrapeConfigConstants;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class OrganizationWebSiteController {

    private OrganizationWebSiteService organizationWebSiteService;
    private SecurityUtils securityUtils;

    @Autowired
    public OrganizationWebSiteController(OrganizationWebSiteService organizationWebSiteService,
                                         SecurityUtils securityUtils) {
        this.organizationWebSiteService = organizationWebSiteService;
        this.securityUtils = securityUtils;
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
    public OrganizationWebSite integrateOrganizationWebSite(@PathVariable UUID organizationId, @RequestBody WebsiteIntegrationDTO websiteIntegrationDTO, Authentication authentication) throws GendoxException {

        if (authentication instanceof ApiKeyAuthenticationToken token &&
            !token.getApiKey().equals(websiteIntegrationDTO.getApiKey().getApiKey())) {
            throw new GendoxException("API_KEY_MISMATCH", "The API key in the request body does not match the API key in the request header", HttpStatus.BAD_REQUEST);
        }

        return organizationWebSiteService.integrateOrganizationWebSite(organizationId, websiteIntegrationDTO);

    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_WEB_SITES', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("/organizations/{organizationId}/websites/web-scrape")
    @Operation(summary = "Add a website that Gendox reads by crawling it",
            description = "Creates the website row and its web scrape integration together. "
                    + "Discovery and scraping are then driven through the web-scrape endpoints.")
    public OrganizationWebSite createWebScrapeSource(@PathVariable UUID organizationId,
                                                     @RequestBody WebScrapeSourceDTO sourceDTO) throws GendoxException {

        if (sourceDTO.getRunIntervalMinutes() != null
                && sourceDTO.getRunIntervalMinutes() < WebScrapeConfigConstants.MIN_RUN_INTERVAL_MINUTES
                && !securityUtils.isSuperAdmin()) {
            throw new GendoxException("WEB_SCRAPE_INTERVAL_TOO_SHORT",
                    "Only a system admin can set an interval shorter than one day",
                    HttpStatus.FORBIDDEN);
        }

        return organizationWebSiteService.createWebScrapeSource(organizationId, sourceDTO);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_WEB_SITES', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("/organizations/{organizationId}/websites")
    public OrganizationWebSite createOrganizationWebSite(@PathVariable UUID organizationId,
                                                         @RequestBody OrganizationWebSiteDTO organizationWebSiteDTO) throws GendoxException {

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
    @Operation(summary = "Remove a website",
            description = "Removes the website row. A crawl source is removed together with the pages "
                    + "it discovered and the documents those pages produced.")
    public void deleteOrganizationWebSite(@PathVariable UUID organizationId,
                                          @PathVariable UUID websiteId) throws GendoxException {

        organizationWebSiteService.deleteOrganizationWebSite(organizationId, websiteId);
    }


}
