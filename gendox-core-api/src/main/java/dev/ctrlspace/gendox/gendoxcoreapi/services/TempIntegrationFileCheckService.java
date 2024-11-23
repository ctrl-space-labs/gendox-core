package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.model.TempIntegrationFileCheck;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TempIntegrationFileCheckRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.FileTypeConstants;
import dev.ctrlspace.gendox.integrations.gendoxnative.model.dto.AssignedContentIdsDTO;
import dev.ctrlspace.gendox.integrations.gendoxnative.model.dto.OrganizationAssignedContentDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Stream;

@Service
public class TempIntegrationFileCheckService {

    Logger logger = LoggerFactory.getLogger(TempIntegrationFileCheckService.class);
    private TempIntegrationFileCheckRepository tempIntegrationFileCheckRepository;
    private TypeService typeService;

    @Autowired
    public TempIntegrationFileCheckService(TempIntegrationFileCheckRepository tempIntegrationFileCheckRepository,
                                           TypeService typeService) {
        this.tempIntegrationFileCheckRepository = tempIntegrationFileCheckRepository;
        this.typeService = typeService;
    }

    String baseUrl = "https://test.dma.com.gr/wp-json";

    public TempIntegrationFileCheck getById(UUID id) {
        return tempIntegrationFileCheckRepository.findById(id).orElse(null);
    }


    public void createTempIntegrationFileChecksByOrganization(OrganizationAssignedContentDTO organizationAssignedContentDTO, UUID integrationId) {
        List<TempIntegrationFileCheck> tempIntegrationFileChecks = new ArrayList<>();
        Set<Long> processedContentIds = new HashSet<>();
        for (AssignedContentIdsDTO assignedContentIdsDTO : organizationAssignedContentDTO.getProjects()) {
            Stream.of(
                            Optional.ofNullable(assignedContentIdsDTO.getAssignedContent().getPosts())
                                    .orElse(Collections.emptyList())
                                    .stream(),
                            Optional.ofNullable(assignedContentIdsDTO.getAssignedContent().getProducts())
                                    .orElse(Collections.emptyList())
                                    .stream(),
                            Optional.ofNullable(assignedContentIdsDTO.getAssignedContent().getPages())
                                    .orElse(Collections.emptyList())
                                    .stream()
                    )
                    .flatMap(i -> i)
                    .forEach(contentIdDTO -> {
                        if (processedContentIds.contains(contentIdDTO.getContentId())) {
                            // Skip adding if content ID is already processed in this iteration
                            logger.info("Skipping duplicate contentId: {}", contentIdDTO.getContentId());
                            return;
                        }
                        String url = baseUrl + "/gendox/v1/content?content_id=" + contentIdDTO.getContentId();
                        TempIntegrationFileCheck tempIntegrationFileCheck = new TempIntegrationFileCheck();
                        tempIntegrationFileCheck.setContentId(contentIdDTO.getContentId());
                        tempIntegrationFileCheck.setProjectID(assignedContentIdsDTO.getProjectId());
                        tempIntegrationFileCheck.setIntegrationId(integrationId);
                        tempIntegrationFileCheck.setFileType(typeService.getFileTypeByName(FileTypeConstants.API_INTEGRATION_FILE));
                        tempIntegrationFileCheck.setCreatedAt(contentIdDTO.getCreatedAt());
                        tempIntegrationFileCheck.setUpdatedAt(contentIdDTO.getUpdatedAt());
                        tempIntegrationFileCheck.setRemoteUrl(url);
                        tempIntegrationFileCheck.setExternalUrl(contentIdDTO.getExternalUrl()); // null as of 2024-11-18
                        tempIntegrationFileChecks.add(tempIntegrationFileCheck);
                        processedContentIds.add(contentIdDTO.getContentId());
                    });
        }

        // TODO @giannis Test this
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
    public List<TempIntegrationFileCheck> getDocsToCreate(UUID integrationId) {
        return tempIntegrationFileCheckRepository.findDocsToCreateByIntegrationId(integrationId);
    }

    /**
     * Retrieves the content IDs of documents to be updated.
     */
    public List<TempIntegrationFileCheck> getDocsToUpdate(UUID integrationId) {
        return tempIntegrationFileCheckRepository.findDocsToUpdate(integrationId);
    }

    /**
     * Retrieves the IDs of DocumentInstance entities to be deleted.
     */
    public List<UUID> getDocsToDelete(UUID integrationId, UUID organizationId) {
        return tempIntegrationFileCheckRepository.findDocsToDeleteByOrganizationId(integrationId, organizationId);
    }

    public void deleteTempIntegrationFileCheck(UUID tempIntegrationFileCheckId) {
        tempIntegrationFileCheckRepository.deleteById(tempIntegrationFileCheckId);

    }

    public void deleteTempIntegrationFileChecksByIntegrationId(UUID integrationId) {
        List<TempIntegrationFileCheck> tempIntegrationFileChecks = tempIntegrationFileCheckRepository.findAll();
        tempIntegrationFileChecks.stream()
                .filter(tempIntegrationFileCheck -> tempIntegrationFileCheck.getIntegrationId().equals(integrationId))
                .forEach(tempIntegrationFileCheck -> tempIntegrationFileCheckRepository.deleteById(tempIntegrationFileCheck.getId()));
    }


}
