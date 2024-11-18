package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.model.TempIntegrationFileCheck;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TempIntegrationFileCheckRepository;
import dev.ctrlspace.gendox.integrations.gendoxnative.model.dto.AssignedContentIdsDTO;
import dev.ctrlspace.gendox.integrations.gendoxnative.model.dto.ContentDTO;
import dev.ctrlspace.gendox.integrations.gendoxnative.model.dto.ContentIdDTO;
import dev.ctrlspace.gendox.integrations.gendoxnative.model.dto.OrganizationAssignedContentDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

@Service
public class TempIntegrationFileCheckService {

    private TempIntegrationFileCheckRepository tempIntegrationFileCheckRepository;

    @Autowired
    public TempIntegrationFileCheckService(TempIntegrationFileCheckRepository tempIntegrationFileCheckRepository) {
        this.tempIntegrationFileCheckRepository = tempIntegrationFileCheckRepository;
    }

    String baseUrl = "https://test.dma.com.gr/wp-json";



    public void createTempIntegrationFileChecksByOrganization(OrganizationAssignedContentDTO organizationAssignedContentDTO) {
        for (AssignedContentIdsDTO assignedContentIdsDTO : organizationAssignedContentDTO.getAssignedContentIdsDTOS()) {
            List<TempIntegrationFileCheck> tempIntegrationFileChecks = new ArrayList<>();
            Stream.of(
                    assignedContentIdsDTO.getPosts().stream(),
                    assignedContentIdsDTO.getProducts().stream(),
                    assignedContentIdsDTO.getPages().stream()
            ).flatMap(i -> i).forEach(contentIdDTO -> {
                String url = baseUrl + "/gendox/v1/content?content_id=" + contentIdDTO.getContentId();
                TempIntegrationFileCheck tempIntegrationFileCheck = new TempIntegrationFileCheck();
                tempIntegrationFileCheck.setContentId(contentIdDTO.getContentId());
                tempIntegrationFileCheck.setCreatedAt(contentIdDTO.getCreatedAt());
                tempIntegrationFileCheck.setUpdatedAt(contentIdDTO.getUpdatedAt());
                tempIntegrationFileCheck.setExternalUrl(url);
                tempIntegrationFileChecks.add(tempIntegrationFileCheck);

            });
        }


    }

    /**
     * Retrieves the content IDs of documents to be created.
     */
    public List<Long> getDocsToCreate() {
        return tempIntegrationFileCheckRepository.findDocsToCreate();
    }

    /**
     * Retrieves the content IDs of documents to be updated.
     */
    public List<Long> getDocsToUpdate() {
        return tempIntegrationFileCheckRepository.findDocsToUpdate();
    }

    /**
     * Retrieves the IDs of DocumentInstance entities to be deleted.
     */
    public List<UUID> getDocsToDelete(UUID organizationId) {
        return tempIntegrationFileCheckRepository.findDocsToDeleteByOrganizationId(organizationId);
    }


}
