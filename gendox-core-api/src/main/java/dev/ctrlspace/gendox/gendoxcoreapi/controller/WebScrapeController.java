package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.WebScrapePageConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.WebScrapeBudgetDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.WebScrapePageDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.WebScrapePageSelectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.WebScrapePageCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.SubscriptionValidationService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.WebScrapePageService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.WebScrapeIntegrationUpdateService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Sort;

import java.util.UUID;

@RestController
public class WebScrapeController {

    private WebScrapePageService webScrapePageService;
    private WebScrapePageConverter webScrapePageConverter;
    private WebScrapeIntegrationUpdateService webScrapeIntegrationUpdateService;
    private SubscriptionValidationService subscriptionValidationService;

    @Autowired
    public WebScrapeController(WebScrapePageService webScrapePageService,
                               WebScrapePageConverter webScrapePageConverter,
                               WebScrapeIntegrationUpdateService webScrapeIntegrationUpdateService,
                               SubscriptionValidationService subscriptionValidationService) {
        this.webScrapePageService = webScrapePageService;
        this.webScrapePageConverter = webScrapePageConverter;
        this.webScrapeIntegrationUpdateService = webScrapeIntegrationUpdateService;
        this.subscriptionValidationService = subscriptionValidationService;
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_INTEGRATIONS', 'getRequestedOrgIdFromPathVariable')")
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

        // Without an order Postgres may return the rows in any order it likes, and it
        // changes one as soon as it is updated: picking a page moved it down the list.
        // The same gap also lets paging show a row twice or miss it altogether.
        if (pageable.getSort().isUnsorted()) {
            pageable = PageRequest.of(
                    pageable.getPageNumber(),
                    pageable.getPageSize(),
                    Sort.by(Sort.Direction.ASC, "url"));
        }

        criteria.setIntegrationId(integrationId.toString());
        webScrapePageService.getIntegration(organizationId, integrationId);

        return webScrapePageService.getAllPages(criteria, pageable)
                .map(webScrapePageConverter::toDTO);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_INTEGRATIONS', 'getRequestedOrgIdFromPathVariable')")
    @PutMapping("/organizations/{organizationId}/integrations/{integrationId}/web-scrape/pages/selection")
    @Operation(summary = "Select or unselect pages of a web scrape integration",
            description = "Either a list of page ids, or every page of the integration when selectAll is true.")
    public void updateSelection(@PathVariable UUID organizationId,
                                @PathVariable UUID integrationId,
                                @RequestBody WebScrapePageSelectionDTO selectionDTO) throws GendoxException {

        webScrapePageService.getIntegration(organizationId, integrationId);

        webScrapePageService.applySelection(integrationId, selectionDTO);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_INTEGRATIONS', 'getRequestedOrgIdFromPathVariable')")
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

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_INTEGRATIONS', 'getRequestedOrgIdFromPathVariable')")
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

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_INTEGRATIONS', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("/organizations/{organizationId}/integrations/{integrationId}/web-scrape/scrape")
    @Operation(summary = "Make the project match the selected pages",
            description = "Asynchronous: returns 202 Accepted. Ticked pages are fetched or fetched "
                    + "again, and a page that is no longer ticked loses the document it produced.")
    public ResponseEntity<Void> scrape(@PathVariable UUID organizationId,
                                       @PathVariable UUID integrationId) throws GendoxException {

        webScrapePageService.getIntegration(organizationId, integrationId);
        webScrapeIntegrationUpdateService.validateScrape(integrationId);

        webScrapeIntegrationUpdateService.triggerScrape(integrationId);

        return ResponseEntity.accepted().build();
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_INTEGRATIONS', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("/organizations/{organizationId}/integrations/{integrationId}/web-scrape/pages/{pageId}/content")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Read one page now",
            description = "Fetches this page and stores it as a document, and ticks it so the next "
                    + "pass keeps it rather than taking it back out.")
    public void fetchPageContent(@PathVariable UUID organizationId,
                                 @PathVariable UUID integrationId,
                                 @PathVariable UUID pageId) throws GendoxException {

        webScrapePageService.getIntegration(organizationId, integrationId);
        webScrapeIntegrationUpdateService.validatePageFetch(integrationId);

        webScrapeIntegrationUpdateService.fetchPage(integrationId, pageId);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_EDIT_INTEGRATIONS', 'getRequestedOrgIdFromPathVariable')")
    @DeleteMapping("/organizations/{organizationId}/integrations/{integrationId}/web-scrape/pages/{pageId}/content")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Take a page's content out of the project",
            description = "Deletes the document this page produced and leaves the page listed, "
                    + "so it can be read again later without crawling the site afresh.")
    public void removePageContent(@PathVariable UUID organizationId,
                                  @PathVariable UUID integrationId,
                                  @PathVariable UUID pageId) throws GendoxException {

        webScrapePageService.getIntegration(organizationId, integrationId);
        webScrapeIntegrationUpdateService.removeContent(integrationId, pageId);
    }

    // the budget belongs to the organization, not to one site, so it is not
    // scoped to an integration: every source spends from the same allowance
    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_INTEGRATIONS', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("/organizations/{organizationId}/web-scrape/budget")
    @Operation(summary = "How many pages may still be read this billing period",
            description = "The monthly page allowance of the active plan, what has been read against it in the current billing period, and what remains.")
    public WebScrapeBudgetDTO getBudget(@PathVariable UUID organizationId) {
        return subscriptionValidationService.getWebScrapeBudget(organizationId);
    }


}
