package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.WebScrapePage;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.WebScrapePageSelectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.WebScrapePageCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.IntegrationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.WebScrapePageRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.WebScrapePagePredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.WebScrapePageStatusConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;


@Service
public class WebScrapePageService {
    Logger logger = LoggerFactory.getLogger(WebScrapePageService.class);

    private WebScrapePageRepository webScrapePageRepository;
    private IntegrationRepository integrationRepository;

    @Autowired
    public WebScrapePageService(WebScrapePageRepository webScrapePageRepository,
                                IntegrationRepository integrationRepository) {
        this.webScrapePageRepository = webScrapePageRepository;
        this.integrationRepository = integrationRepository;
    }

    public Page<WebScrapePage> getAllPages(WebScrapePageCriteria criteria, Pageable pageable) {
        return webScrapePageRepository.findAll(WebScrapePagePredicates.build(criteria), pageable);
    }

    public WebScrapePage getById(UUID id) throws GendoxException {
        return webScrapePageRepository.findById(id)
                .orElseThrow(() -> new GendoxException("WEB_SCRAPE_PAGE_NOT_FOUND",
                        "Web scrape page not found: " + id, HttpStatus.NOT_FOUND));
    }

    /**
     * Selects or unselects the given pages. Ids that belong to another integration are ignored.
     */
    public void updateSelection(UUID integrationId, List<UUID> pageIds, boolean selected) throws GendoxException {

        if (pageIds == null || pageIds.isEmpty()) {
            throw new GendoxException("WEB_SCRAPE_PAGE_IDS_EMPTY",
                    "No pages were given to update", HttpStatus.BAD_REQUEST);
        }

        List<WebScrapePage> pages = webScrapePageRepository
                .findAllByIdInAndIntegrationId(pageIds, integrationId)
                .stream()
                .filter(page -> !WebScrapePageStatusConstants.REMOVED.equals(page.getStatus()))
                .toList();

        for (WebScrapePage page : pages) {
            page.setSelected(selected);
        }

        webScrapePageRepository.saveAll(pages);
    }

    /**
     * Selects or unselects every page of the integration in one statement.
     */
    public void selectAll(UUID integrationId, boolean selected) {

        int updated = webScrapePageRepository.updateSelectionForIntegration(
                integrationId, selected, WebScrapePageStatusConstants.REMOVED);

        logger.debug("Changed the selection of {} pages of integration {}", updated, integrationId);
    }

    /**
     * Loads the integration only if it belongs to the organization of the path. Every web scrape
     * endpoint calls this first: the authority check covers the organization, not the integration.
     */
    public Integration getIntegration(UUID organizationId, UUID integrationId) throws GendoxException {

        Integration integration = integrationRepository.findById(integrationId)
                .orElseThrow(() -> new GendoxException("INTEGRATION_NOT_FOUND",
                        "Integration not found: " + integrationId, HttpStatus.NOT_FOUND));

        if (!organizationId.equals(integration.getOrganizationId())) {
            throw new GendoxException("INTEGRATION_NOT_FOUND",
                    "Integration not found: " + integrationId, HttpStatus.NOT_FOUND);
        }

        return integration;
    }

    public void applySelection(UUID integrationId, WebScrapePageSelectionDTO selectionDTO) throws GendoxException {

        if (selectionDTO.getSelected() == null) {
            throw new GendoxException("WEB_SCRAPE_SELECTION_MISSING",
                    "The request must say whether the pages are selected or not",
                    HttpStatus.BAD_REQUEST);
        }

        if (Boolean.TRUE.equals(selectionDTO.getSelectAll())) {
            selectAll(integrationId, selectionDTO.getSelected());
            return;
        }

        updateSelection(integrationId, selectionDTO.getPageIds(), selectionDTO.getSelected());
    }
}
