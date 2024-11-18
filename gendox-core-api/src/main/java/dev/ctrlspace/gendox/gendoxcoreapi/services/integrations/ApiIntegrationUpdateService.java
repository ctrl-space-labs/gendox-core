package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.IntegratedFilesDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectIntegrationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TempIntegrationFileCheckService;
import dev.ctrlspace.gendox.integrations.gendoxnative.model.dto.*;
import dev.ctrlspace.gendox.integrations.gendoxnative.services.GendoxNativeIntegrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;


@Component
public class ApiIntegrationUpdateService implements IntegrationUpdateService {
    Logger logger = LoggerFactory.getLogger(ApiIntegrationUpdateService.class);

    private DocumentService documentService;
    private GendoxNativeIntegrationService gendoxNativeIntegrationService;
    private TempIntegrationFileCheckService tempIntegrationFileCheckService;

    @Autowired
    public ApiIntegrationUpdateService(DocumentService documentService,
                                       GendoxNativeIntegrationService gendoxNativeIntegrationService,
                                       TempIntegrationFileCheckService tempIntegrationFileCheckService) {
        this.documentService = documentService;
        this.gendoxNativeIntegrationService = gendoxNativeIntegrationService;
        this.tempIntegrationFileCheckService = tempIntegrationFileCheckService;
    }

    String baseUrl = "https://test.dma.com.gr/wp-json";
    String apiKey = "k9gz4TUVuUtEdKZnMNWZk7fg4B63bquX";


    @Override
    public Map<ProjectIntegrationDTO, IntegratedFilesDTO> checkForUpdates(Integration integration) throws GendoxException {
        UUID organizationId = integration.getOrganizationId();
        Map<ProjectIntegrationDTO, IntegratedFilesDTO> organizationMap = new HashMap<>();
        OrganizationAssignedContentDTO organizationAssignedContentDTO = gendoxNativeIntegrationService.getProjectAssignedContentsByOrganizationId(baseUrl, organizationId.toString(), apiKey);
        Map<String, List<ContentIdDTO>> projectContentMap = new HashMap<>();
        tempIntegrationFileCheckService.createTempIntegrationFileChecksByOrganization(organizationAssignedContentDTO);


        // Retrieve lists of document actions
        List<Long> docsToCreate = tempIntegrationFileCheckService.getDocsToCreate();
        List<Long> docsToUpdate = tempIntegrationFileCheckService.getDocsToUpdate();
        List<UUID> docsToDelete = tempIntegrationFileCheckService.getDocsToDelete(organizationId);

        // Log the results
        logger.info("Docs to Create (content IDs): {}", docsToCreate);
        logger.info("Docs to Update (content IDs): {}", docsToUpdate);
        logger.info("Docs to Delete (DocumentInstance IDs): {}", docsToDelete);


        organizationMap = createMap(projectContentMap, integration);

        return organizationMap;

    }





    private Boolean isContentUpdated(ContentIdDTO contentIdDTO ,ContentDTO contentDTO, UUID projectId, UUID organizationId) throws GendoxException {
        DocumentInstance documentInstance = documentService.getDocumentByFileName(projectId, organizationId, contentDTO.getTitle());

        if (documentInstance == null) {
            return false;
        }

        return documentInstance.getUpdatedAt().isBefore(contentIdDTO.getUpdatedAt());

    }



    private Map<ProjectIntegrationDTO, IntegratedFilesDTO> createMap(Map<String, List<ContentIdDTO>> projectContentMap, Integration integration) {
        Map<ProjectIntegrationDTO, IntegratedFilesDTO> map = new HashMap<>();
        for (Map.Entry<String, List<ContentIdDTO>> entry : projectContentMap.entrySet()) {
            ProjectIntegrationDTO projectIntegrationDTO = ProjectIntegrationDTO.builder()
                    .projectId(integration.getProjectId())
                    .integrationId(integration.getId())
                    .integrationType(integration.getIntegrationType())
                    .build();



            IntegratedFilesDTO integratedFilesDTO = IntegratedFilesDTO.builder()
                    .contentIdDTOLists(Map.of(entry.getKey(), entry.getValue()))
                    .build();
            map.put(projectIntegrationDTO, integratedFilesDTO);
        }

        return map;
    }


}
