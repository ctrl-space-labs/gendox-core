package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TempIntegrationFileCheck;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TempIntegrationFileCheckRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ApiIntegrationStatusConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.FileTypeConstants;
import dev.ctrlspace.gendox.integrations.gendox.api.model.dto.AssignedProjectDTO;
import dev.ctrlspace.gendox.integrations.gendox.api.model.dto.OrganizationAssignedContentDTO;
import io.micrometer.tracing.Tracer;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class TempIntegrationFileCheckService {

    Logger logger = LoggerFactory.getLogger(TempIntegrationFileCheckService.class);
    private TempIntegrationFileCheckRepository tempIntegrationFileCheckRepository;
    private TypeService typeService;
    private OrganizationWebSiteService organizationWebSiteService;
    private Tracer tracer;

    @Autowired
    public TempIntegrationFileCheckService(TempIntegrationFileCheckRepository tempIntegrationFileCheckRepository,
                                           TypeService typeService,
                                           OrganizationWebSiteService organizationWebSiteService,
                                           Tracer tracer
    ) {
        this.tempIntegrationFileCheckRepository = tempIntegrationFileCheckRepository;
        this.typeService = typeService;
        this.organizationWebSiteService = organizationWebSiteService;
        this.tracer = tracer;
    }


    public TempIntegrationFileCheck getById(UUID id) {
        return tempIntegrationFileCheckRepository.findById(id).orElse(null);
    }


    public void createTempIntegrationFileChecksByOrganization(OrganizationAssignedContentDTO organizationAssignedContentDTO, Integration integration) {
        List<TempIntegrationFileCheck> tempIntegrationFileChecks = new ArrayList<>();
        String domain = organizationWebSiteService.getByIntegrationId(integration.getId()).getUrl();

        for (AssignedProjectDTO assignedProjectDTO : organizationAssignedContentDTO.getProjects()) {
            Optional.ofNullable(assignedProjectDTO.getAssignedContent())
                    .orElse(Collections.emptyList())
                    .forEach(assignedContentDTO -> {
                        // Check if the status is "publish"
                        if (!ApiIntegrationStatusConstants.PUBLISH.equals(assignedContentDTO.getStatus())) {
                            return;
                        }

                        TempIntegrationFileCheck tempIntegrationFileCheck = new TempIntegrationFileCheck();
                        tempIntegrationFileCheck.setContentId(assignedContentDTO.getContentId());
                        tempIntegrationFileCheck.setProjectID(assignedProjectDTO.getProjectId());
                        tempIntegrationFileCheck.setIntegrationId(integration.getId());
                        tempIntegrationFileCheck.setFileType(typeService.getFileTypeByName(FileTypeConstants.API_INTEGRATION_FILE));
                        tempIntegrationFileCheck.setCreatedAt(assignedContentDTO.getCreatedAt());
                        tempIntegrationFileCheck.setUpdatedAt(assignedContentDTO.getUpdatedAt());
                        tempIntegrationFileCheck.setTitle(assignedContentDTO.getTitle());
                        tempIntegrationFileCheck.setRemoteUrl(domain + integration.getUrl() + "/content?content_id=" + assignedContentDTO.getContentId());
                        tempIntegrationFileCheck.setExternalUrl(assignedContentDTO.getExternalUrl()); // null as of 2024-11-18
                        if (tracer.currentSpan() != null) {
                            tempIntegrationFileCheck.setTraceId(tracer.currentSpan().context().traceId());
                        }
                        tempIntegrationFileChecks.add(tempIntegrationFileCheck);
                    });
        }

        if (!tempIntegrationFileChecks.isEmpty()) {
            tempIntegrationFileCheckRepository.saveAll(tempIntegrationFileChecks);
            logger.info("Saved {} new TempIntegrationFileCheck entities.", tempIntegrationFileChecks.size());
        } else {
            logger.info("No new TempIntegrationFileCheck entities to save.");
        }


    }

    /**
     * Retrieves the content IDs of documents to be created.
     */
    public List<TempIntegrationFileCheck> getDocsToCreate(UUID integrationId, String traceId) {
        return tempIntegrationFileCheckRepository.findDocsToCreateByIntegrationId(integrationId, traceId);
    }

    /**
     * Retrieves the content IDs of documents to be updated.
     */
    public List<TempIntegrationFileCheck> getDocsToUpdate(UUID integrationId, String traceId) {
        return tempIntegrationFileCheckRepository.findDocsToUpdate(integrationId, traceId);
    }

    /**
     * Retrieves the IDs of DocumentInstance entities to be deleted.
     */
    public List<UUID> getDocsToDelete(UUID integrationId, UUID organizationId, String traceId) {
        return tempIntegrationFileCheckRepository.findDocsToDeleteByOrganizationId(integrationId, organizationId);
    }

    public void deleteTempIntegrationFileCheck(UUID tempIntegrationFileCheckId) {
        tempIntegrationFileCheckRepository.deleteById(tempIntegrationFileCheckId);

    }

    @Transactional
    public void deleteTempIntegrationFileChecksByIntegrationId(UUID integrationId) {
        tempIntegrationFileCheckRepository.deleteAllByIntegrationId(integrationId);
        logger.info("Deleting all TempIntegrationFileCheck entities by integrationId: {}", integrationId);

    }


}
