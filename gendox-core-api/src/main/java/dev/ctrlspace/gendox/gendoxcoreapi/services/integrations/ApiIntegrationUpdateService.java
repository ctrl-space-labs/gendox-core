package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TempIntegrationFileCheck;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.IntegratedFileDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectIntegrationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.OrganizationWebSiteRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ApiKeyService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationWebSiteService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TempIntegrationFileCheckService;
import dev.ctrlspace.gendox.integrations.gendox.api.model.dto.AssignedContentDTO;
import dev.ctrlspace.gendox.integrations.gendox.api.model.dto.OrganizationAssignedContentDTO;
import dev.ctrlspace.gendox.integrations.gendox.api.services.GendoxAPIIntegrationService;
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
    private GendoxAPIIntegrationService gendoxAPIIntegrationService;
    private TempIntegrationFileCheckService tempIntegrationFileCheckService;
    private ApiKeyService apiKeyService;
    private OrganizationWebSiteService organizationWebSiteService;

    @Autowired
    public ApiIntegrationUpdateService(DocumentService documentService,
                                       GendoxAPIIntegrationService gendoxAPIIntegrationService,
                                       TempIntegrationFileCheckService tempIntegrationFileCheckService,
                                       ApiKeyService apiKeyService,
                                       OrganizationWebSiteService organizationWebSiteService) {
        this.documentService = documentService;
        this.gendoxAPIIntegrationService = gendoxAPIIntegrationService;
        this.tempIntegrationFileCheckService = tempIntegrationFileCheckService;
        this.apiKeyService = apiKeyService;
        this.organizationWebSiteService = organizationWebSiteService;
    }

    @Override
    @Transactional(value = Transactional.TxType.REQUIRES_NEW)
    public Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> checkForUpdates(Integration integration) throws GendoxException {
        String apiKey = apiKeyService.getByIntegrationId(integration.getId()).getApiKey();
        String domain = organizationWebSiteService.getByIntegrationId(integration.getId()).getUrl();
        String baseUrl = domain + integration.getUrl();
        UUID organizationId = integration.getOrganizationId();
        Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> organizationMap = new HashMap<>();
        OrganizationAssignedContentDTO organizationAssignedContentDTO = gendoxAPIIntegrationService.getProjectAssignedContentsByOrganizationId(baseUrl, organizationId.toString(), apiKey);

        tempIntegrationFileCheckService.createTempIntegrationFileChecksByOrganization(organizationAssignedContentDTO, integration);


        // Retrieve lists of document actions
        List<TempIntegrationFileCheck> docsToCreate = tempIntegrationFileCheckService.getDocsToCreate(integration.getId());
        List<TempIntegrationFileCheck> docsToUpdate = tempIntegrationFileCheckService.getDocsToUpdate(integration.getId());
        List<UUID> docsToDelete = tempIntegrationFileCheckService.getDocsToDelete(integration.getId(), organizationId);

        // Log the results
        logger.debug("Docs to Create (content IDs): {}", docsToCreate.size());
        logger.debug("Docs to Update (content IDs): {}", docsToUpdate.size());
        logger.debug("Docs to Delete (DocumentInstance IDs): {}", docsToDelete.size());

        //DELETE files in docsToDelete
        if (!docsToDelete.isEmpty()) {
            documentService.deleteAllDocumentInstances(docsToDelete);
        }

        //create from docsToCreate and docsToUpdate a map of Map<project_id, ContentIDDto>
        Map<UUID, List<TempIntegrationFileCheck>> projectContentMap = new HashMap<>();
        // populate the above map
        Stream.of(docsToUpdate.stream(), docsToCreate.stream())
                .flatMap(tempFile -> tempFile)
                .forEach(tempFile -> {
                    UUID projectId = tempFile.getProjectID();
                    if (!projectContentMap.containsKey(projectId)) {
                        projectContentMap.put(projectId, new ArrayList<>());
                    }
                    projectContentMap.get(projectId).add(tempFile);
                });

        if (projectContentMap.isEmpty()) {
            tempIntegrationFileCheckService.deleteTempIntegrationFileChecksByIntegrationId(integration.getId());
        }

        organizationMap = createMap(projectContentMap, integration);

        return organizationMap;

    }


    private Boolean isContentUpdated(AssignedContentDTO assignedContentDTO, UUID projectId, UUID organizationId) throws GendoxException {
        DocumentInstance documentInstance = documentService.getDocumentByFileName(projectId, organizationId, assignedContentDTO.getTitle());

        if (documentInstance == null) {
            return false;
        }

        return documentInstance.getUpdatedAt().isBefore(assignedContentDTO.getUpdatedAt());

    }


    private Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> createMap(Map<UUID, List<TempIntegrationFileCheck>> projectContentMap, Integration integration) {
        Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> map = new HashMap<>();
        for (Map.Entry<UUID, List<TempIntegrationFileCheck>> entry : projectContentMap.entrySet()) {
            ProjectIntegrationDTO projectIntegrationDTO = ProjectIntegrationDTO.builder()
                    .projectId(entry.getKey())
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
