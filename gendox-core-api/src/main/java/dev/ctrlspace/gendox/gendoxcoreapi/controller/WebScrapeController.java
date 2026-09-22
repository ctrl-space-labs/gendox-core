package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.WebScrapePageConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.WebScrapePageDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.WebScrapePageSelectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.WebScrapeScheduleDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.WebScrapePageCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.WebScrapePageService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.WebScrapeIntegrationUpdateService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.WebScrapeConfigConstants;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
public class WebScrapeController {

    private WebScrapePageService webScrapePageService;
    private WebScrapePageConverter webScrapePageConverter;
    private WebScrapeIntegrationUpdateService webScrapeIntegrationUpdateService;
    private SecurityUtils securityUtils;

    @Autowired
    public WebScrapeController(WebScrapePageService webScrapePageService,
                               WebScrapePageConverter webScrapePageConverter,
                               WebScrapeIntegrationUpdateService webScrapeIntegrationUpdateService,
                               SecurityUtils securityUtils) {
        this.webScrapePageService = webScrapePageService;
        this.webScrapePageConverter = webScrapePageConverter;
        this.webScrapeIntegrationUpdateService = webScrapeIntegrationUpdateService;
        this.securityUtils = securityUtils;
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_ORGANIZATION_WEB_SITES', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("/organizations/{organizationId}/integrations/{integrationId}/web-scrape/pages")
    @Operation(summary = "Get the pages discovered for a web scrape integration",
            description = "Returns the pages of the site, filtered by status and by whether the user has selected them.")
    public Page<WebScrapePageDTO> getPages(@PathVariable UUID organizationId,
                                           @PathVariable UUID integrationId,
                                           WebScrapePageCriteria criteria,
                                           Pageable pageable) throws GendoxException {

        if (pageable == null) {
            pageable = PageRequest.of(0, 100);
        }

        if (pageable.getPageSize() > 100) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED",
                    "Page size can't be more than 100", HttpStatus.BAD_REQUEST);
        }

        criteria.setIntegrationId(integrationId.toString());
        webScrapePageService.getIntegration(organizationId, integrationId);

        return webScrapePageService.getAllPages(criteria, pageable)
                .map(webScrapePageConverter::toDTO);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_WEB_SITES', 'getRequestedOrgIdFromPathVariable')")
    @PutMapping("/organizations/{organizationId}/integrations/{integrationId}/web-scrape/pages/selection")
    @Operation(summary = "Select or unselect pages of a web scrape integration",
            description = "Either a list of page ids, or every page of the integration when selectAll is true.")
    public void updateSelection(@PathVariable UUID organizationId,
                                @PathVariable UUID integrationId,
                                @RequestBody WebScrapePageSelectionDTO selectionDTO) throws GendoxException {

        webScrapePageService.getIntegration(organizationId, integrationId);

        webScrapePageService.applySelection(integrationId, selectionDTO);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_WEB_SITES', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("/organizations/{organizationId}/integrations/{integrationId}/web-scrape/crawl")
    @Operation(summary = "List the pages of the site",
            description = "Asynchronous: returns 202 Accepted and the pages appear in GET .../pages as they are found.")
    public ResponseEntity<Void> crawl(@PathVariable UUID organizationId,
                                      @PathVariable UUID integrationId) throws GendoxException {

        webScrapePageService.getIntegration(organizationId, integrationId);
        webScrapeIntegrationUpdateService.validateCrawl(integrationId);

        webScrapeIntegrationUpdateService.triggerCrawl(integrationId);

        return ResponseEntity.accepted().build();
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_WEB_SITES', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("/organizations/{organizationId}/integrations/{integrationId}/web-scrape/deep-crawl")
    @Operation(summary = "Search the site in depth",
            description = "Asynchronous: returns 202 Accepted. Visits every page of the site and is charged for each one, "
                    + "up to the crawl page limit of the integration.")
    public ResponseEntity<Void> deepCrawl(@PathVariable UUID organizationId,
                                          @PathVariable UUID integrationId) throws GendoxException {

        webScrapePageService.getIntegration(organizationId, integrationId);
        webScrapeIntegrationUpdateService.validateDeepCrawl(integrationId);

        webScrapeIntegrationUpdateService.triggerDeepCrawl(integrationId);

        return ResponseEntity.accepted().build();
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_WEB_SITES', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("/organizations/{organizationId}/integrations/{integrationId}/web-scrape/scrape")
    @Operation(summary = "Download the selected pages",
            description = "Asynchronous: returns 202 Accepted. Each page becomes a document of the project.")
    public ResponseEntity<Void> scrape(@PathVariable UUID organizationId,
                                       @PathVariable UUID integrationId) throws GendoxException {

        webScrapePageService.getIntegration(organizationId, integrationId);
        webScrapeIntegrationUpdateService.validateScrape(integrationId);

        webScrapeIntegrationUpdateService.triggerScrape(integrationId);

        return ResponseEntity.accepted().build();
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_ORGANIZATION_WEB_SITES', 'getRequestedOrgIdFromPathVariable')")
    @PutMapping("/organizations/{organizationId}/integrations/{integrationId}/web-scrape/schedule")
    @Operation(summary = "Set how often the site is scraped",
            description = "Also sets the provider and the crawl page limit. Fields left out keep their current value.")
    public void updateSchedule(@PathVariable UUID organizationId,
                               @PathVariable UUID integrationId,
                               @RequestBody WebScrapeScheduleDTO scheduleDTO) throws GendoxException {

        Integration integration = webScrapePageService.getIntegration(organizationId, integrationId);

        if (scheduleDTO.getRunIntervalMinutes() != null
                && scheduleDTO.getRunIntervalMinutes() < WebScrapeConfigConstants.MIN_RUN_INTERVAL_MINUTES
                && !securityUtils.isSuperAdmin()) {
            throw new GendoxException("WEB_SCRAPE_INTERVAL_TOO_SHORT",
                    "Only a system admin can set an interval shorter than one day",
                    HttpStatus.FORBIDDEN);
        }

        webScrapeIntegrationUpdateService.updateSchedule(integration, scheduleDTO);
    }


}
