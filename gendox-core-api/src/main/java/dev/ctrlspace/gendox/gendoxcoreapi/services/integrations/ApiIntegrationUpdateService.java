package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TempIntegrationFileCheck;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.IntegratedFileDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectIntegrationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TempIntegrationFileCheckService;
import dev.ctrlspace.gendox.integrations.gendox.api.model.dto.ContentDTO;
import dev.ctrlspace.gendox.integrations.gendox.api.model.dto.ContentIdDTO;
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

    @Autowired
    public ApiIntegrationUpdateService(DocumentService documentService,
                                       GendoxAPIIntegrationService gendoxAPIIntegrationService,
                                       TempIntegrationFileCheckService tempIntegrationFileCheckService) {
        this.documentService = documentService;
        this.gendoxAPIIntegrationService = gendoxAPIIntegrationService;
        this.tempIntegrationFileCheckService = tempIntegrationFileCheckService;
    }

    String apiKey = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJDR0NpMlNTX2lQNkdGYTBKQmVqRjAxYzNpcDBTdm43d2FLMGNYQnJHR19RIn0.eyJleHAiOjE3MzI0MDE1NjgsImlhdCI6MTczMjM1ODM2OCwiYXV0aF90aW1lIjoxNzMyMzU4MzY3LCJqdGkiOiJkNDU4MjliZi03YzQ0LTRlMmQtYTZkNS1hOGMxNzk4ZGQzNTUiLCJpc3MiOiJodHRwczovL2Rldi5nZW5kb3guY3RybHNwYWNlLmRldi9pZHAvcmVhbG1zL2dlbmRveC1pZHAtZGV2IiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjEyYjYwNGQ4LTk1OTktNDk3ZS05ZDA4LTAwYjdkZmQ5ZmVkMiIsInR5cCI6IkJlYXJlciIsImF6cCI6ImdlbmRveC1wa2NlLXB1YmxpYy1jbGllbnQtZGV2Iiwic2lkIjoiZTFhM2Y5NDgtZjkzNy00N2NkLWI2M2QtZDRhZjk4OTZhZGY3IiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyJodHRwczovL2Rldi5nZW5kb3guY3RybHNwYWNlLmRldiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiZGVmYXVsdC1yb2xlcy1nZW5kb3gtaWRwLWRldiIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBlbWFpbCBwcm9maWxlIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJBY2NvdW50IG9uZSBUZXN0QWNjb3VudCAiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzZWxvbW81MDA5QGV4d2VtZS5jb20iLCJnaXZlbl9uYW1lIjoiQWNjb3VudCBvbmUiLCJmYW1pbHlfbmFtZSI6IlRlc3RBY2NvdW50ICIsImVtYWlsIjoic2Vsb21vNTAwOUBleHdlbWUuY29tIn0.g5q4vjxCo7hv-l_NIEKxetNEvny7nlzmmjWHHZDfXbFekcDLaB9qFLM9oZYDvU2FwmT9rM3lNKORp6nnVw2x6DFfecWo1m0of6Ov5md04onu5OdSvDhYHzcwjROXGX5-8zNJxi65ZIpCBXWJmZdKhAs0pIWdYB6USGFzWkfqUpqtw4UnypUgqckDFVOYLLswfY8fpGYiJnimPvwCy-DLPpVS6Ic97UgwrGSTcievQOielLUokyGGzS6igSJLw93y24ZAwEytt8whPLAeuPqPRUoNrNN2leZK2tAzrpHsso5cPb6SQ-mSGFFbHDBcbdC_1RcGbm7qsHQu_jxv37K2_Q";
    @Override
    @Transactional(value = Transactional.TxType.REQUIRES_NEW)
    public Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> checkForUpdates(Integration integration) throws GendoxException {
        UUID organizationId = integration.getOrganizationId();
        Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> organizationMap = new HashMap<>();
        OrganizationAssignedContentDTO organizationAssignedContentDTO = gendoxAPIIntegrationService.getProjectAssignedContentsByOrganizationId(integration.getUrl(), organizationId.toString(), apiKey);

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





    private Boolean isContentUpdated(ContentIdDTO contentIdDTO , ContentDTO contentDTO, UUID projectId, UUID organizationId) throws GendoxException {
        DocumentInstance documentInstance = documentService.getDocumentByFileName(projectId, organizationId, contentDTO.getTitle());

        if (documentInstance == null) {
            return false;
        }

        return documentInstance.getUpdatedAt().isBefore(contentIdDTO.getUpdatedAt());

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
