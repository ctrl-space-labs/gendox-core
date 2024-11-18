package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TempIntegrationFileCheck;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.IntegratedFileDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectIntegrationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TempIntegrationFileCheckService;
import dev.ctrlspace.gendox.integrations.gendoxnative.model.dto.*;
import dev.ctrlspace.gendox.integrations.gendoxnative.services.GendoxNativeIntegrationService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.stream.Stream;


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
    @Transactional(value = Transactional.TxType.REQUIRES_NEW)
    public Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> checkForUpdates(Integration integration) throws GendoxException {
        UUID organizationId = integration.getOrganizationId();
        Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> organizationMap = new HashMap<>();
        OrganizationAssignedContentDTO organizationAssignedContentDTO = gendoxNativeIntegrationService.getProjectAssignedContentsByOrganizationId(baseUrl, organizationId.toString(), apiKey);

        tempIntegrationFileCheckService.createTempIntegrationFileChecksByOrganization(organizationAssignedContentDTO, integration.getId());


        // Retrieve lists of document actions
        List<TempIntegrationFileCheck> docsToCreate = tempIntegrationFileCheckService.getDocsToCreate(integration.getId());
        List<TempIntegrationFileCheck> docsToUpdate = tempIntegrationFileCheckService.getDocsToUpdate(integration.getId());
        List<UUID> docsToDelete = tempIntegrationFileCheckService.getDocsToDelete(integration.getId(), organizationId);

        // TODO @Giannis DELETE files in docsToDelete

        // Log the results
        logger.debug("Docs to Create (content IDs): {}", docsToCreate.size());
        logger.debug("Docs to Update (content IDs): {}", docsToUpdate.size());
        logger.debug("Docs to Delete (DocumentInstance IDs): {}", docsToDelete.size());

        //create from docsToCreate and docsToUpdate a map of Map<project_id, ContentIDDto>

        Map<String, List<TempIntegrationFileCheck>> projectContentMap = new HashMap<>();
        // populate the above map
        Stream.of(docsToUpdate.stream(), docsToCreate.stream())
                .flatMap(tempFile -> tempFile)
                .forEach(tempFile -> {
                    String projectId = tempFile.getProjectID().toString();
                    if (!projectContentMap.containsKey(projectId)) {
                        projectContentMap.put(projectId, new ArrayList<>());
                    }
                    projectContentMap.get(projectId).add(tempFile);
                });


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



    private Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> createMap(Map<String, List<TempIntegrationFileCheck>> projectContentMap, Integration integration) {
        Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> map = new HashMap<>();
        for (Map.Entry<String, List<TempIntegrationFileCheck>> entry : projectContentMap.entrySet()) {
            ProjectIntegrationDTO projectIntegrationDTO = ProjectIntegrationDTO.builder()
                    .projectId(integration.getProjectId())
                    .integration(integration)
                    .build();

            var wrappedFiles = entry.getValue()
                    .stream()
                    .map(tempFile -> IntegratedFileDTO.builder().externalFile(tempFile).build())
                    .toList();
            map.put(projectIntegrationDTO, wrappedFiles);
        }

        return map;
    }


}
