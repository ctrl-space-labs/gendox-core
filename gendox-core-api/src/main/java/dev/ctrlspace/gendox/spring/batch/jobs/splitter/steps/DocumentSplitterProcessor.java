package dev.ctrlspace.gendox.spring.batch.jobs.splitter.steps;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ApiKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationWebSite;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ApiKeyService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DownloadService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationWebSiteService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectAgentService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.CryptographyUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.ServiceSelector;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.documents.DocumentSplitter;
import dev.ctrlspace.gendox.integrations.gendox.api.services.GendoxAPIIntegrationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;


import java.util.ArrayList;
import java.util.List;

@Component
@StepScope
public class DocumentSplitterProcessor implements ItemProcessor<DocumentInstance, DocumentSectionDTO> {

    Logger logger = LoggerFactory.getLogger(DocumentSplitterProcessor.class);
    @Value("#{jobParameters['skipUnchangedDocs']}")
    protected Boolean skipUnchangedDocs;

    private ServiceSelector serviceSelector;
    private ProjectAgentService projectAgentService;
    private DownloadService downloadService;
    private GendoxAPIIntegrationService gendoxAPIIntegrationService;
    private CryptographyUtils cryptographyUtils;
    private ApiKeyService apiKeyService;
    private OrganizationWebSiteService organizationWebSiteService;


    @Autowired
    public DocumentSplitterProcessor(ServiceSelector serviceSelector,
                                     ProjectAgentService projectAgentService,
                                     DownloadService downloadService,
                                     GendoxAPIIntegrationService gendoxAPIIntegrationService,
                                     CryptographyUtils cryptographyUtils,
                                     ApiKeyService apiKeyService,
                                     OrganizationWebSiteService organizationWebSiteService) {
        this.serviceSelector = serviceSelector;
        this.projectAgentService = projectAgentService;
        this.downloadService = downloadService;
        this.gendoxAPIIntegrationService = gendoxAPIIntegrationService;
        this.cryptographyUtils = cryptographyUtils;
        this.apiKeyService = apiKeyService;
        this.organizationWebSiteService = organizationWebSiteService;
    }

    String tempApiKey = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJDR0NpMlNTX2lQNkdGYTBKQmVqRjAxYzNpcDBTdm43d2FLMGNYQnJHR19RIn0.eyJleHAiOjE3MzI0MDE1NjgsImlhdCI6MTczMjM1ODM2OCwiYXV0aF90aW1lIjoxNzMyMzU4MzY3LCJqdGkiOiJkNDU4MjliZi03YzQ0LTRlMmQtYTZkNS1hOGMxNzk4ZGQzNTUiLCJpc3MiOiJodHRwczovL2Rldi5nZW5kb3guY3RybHNwYWNlLmRldi9pZHAvcmVhbG1zL2dlbmRveC1pZHAtZGV2IiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjEyYjYwNGQ4LTk1OTktNDk3ZS05ZDA4LTAwYjdkZmQ5ZmVkMiIsInR5cCI6IkJlYXJlciIsImF6cCI6ImdlbmRveC1wa2NlLXB1YmxpYy1jbGllbnQtZGV2Iiwic2lkIjoiZTFhM2Y5NDgtZjkzNy00N2NkLWI2M2QtZDRhZjk4OTZhZGY3IiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyJodHRwczovL2Rldi5nZW5kb3guY3RybHNwYWNlLmRldiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiZGVmYXVsdC1yb2xlcy1nZW5kb3gtaWRwLWRldiIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBlbWFpbCBwcm9maWxlIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJBY2NvdW50IG9uZSBUZXN0QWNjb3VudCAiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzZWxvbW81MDA5QGV4d2VtZS5jb20iLCJnaXZlbl9uYW1lIjoiQWNjb3VudCBvbmUiLCJmYW1pbHlfbmFtZSI6IlRlc3RBY2NvdW50ICIsImVtYWlsIjoic2Vsb21vNTAwOUBleHdlbWUuY29tIn0.g5q4vjxCo7hv-l_NIEKxetNEvny7nlzmmjWHHZDfXbFekcDLaB9qFLM9oZYDvU2FwmT9rM3lNKORp6nnVw2x6DFfecWo1m0of6Ov5md04onu5OdSvDhYHzcwjROXGX5-8zNJxi65ZIpCBXWJmZdKhAs0pIWdYB6USGFzWkfqUpqtw4UnypUgqckDFVOYLLswfY8fpGYiJnimPvwCy-DLPpVS6Ic97UgwrGSTcievQOielLUokyGGzS6igSJLw93y24ZAwEytt8whPLAeuPqPRUoNrNN2leZK2tAzrpHsso5cPb6SQ-mSGFFbHDBcbdC_1RcGbm7qsHQu_jxv37K2_Q";

    @Override
    public DocumentSectionDTO process(DocumentInstance instance) throws Exception {
        List<String> contentSections = new ArrayList<>();
        ProjectAgent agent = new ProjectAgent();
        if ("API_INTEGRATION_FILE".equals(instance.getFileType().getName())) {
            OrganizationWebSite organizationWebSite = organizationWebSiteService.getOrganizationWebSite(instance.getOrganizationId(), instance.getRemoteUrl());
            ApiKey apiKey = apiKeyService.getById(organizationWebSite.getApiKeyId());
        }
        Boolean documentUpdated = false;
        logger.trace("Start processing split: {}", instance.getId());


        try {
            String fileContent = downloadService.readDocumentContent(instance.getRemoteUrl());

            fileContent = (instance.getFileType() == null || !"API_INTEGRATION_FILE".equals(instance.getFileType().getName()))
                    ? downloadService.readDocumentContent(instance.getRemoteUrl())
                    : gendoxAPIIntegrationService.getContentById(instance.getRemoteUrl(), tempApiKey).getContent();

            if (instance.getFileType() == null) {
                logger.warn("DocumentInstance {} has a null fileType. Using remoteUrl to retrieve content.", instance.getId());
            }

            // SHA-256 hash check only if splitAllDocuments is false
            if (Boolean.TRUE.equals(skipUnchangedDocs)) {
                String documentSha256Hash = cryptographyUtils.calculateSHA256(fileContent);
                logger.trace("SHA-256 hash of document {}: {}", instance.getId(), documentSha256Hash);

                // If hashes match, content hasn't changed; skip splitting
                if (documentSha256Hash.equals(instance.getDocumentSha256Hash())) {
                    logger.trace("No changes detected for document {}. Skipping split.", instance.getId());
                    return null;
                }

                instance.setDocumentSha256Hash(documentSha256Hash);
                documentUpdated = true;
            } else {
                logger.trace("splitAllDocuments is true, skipping SHA-256 check for document {}.", instance.getId());
            }


            agent = projectAgentService.getAgentByDocumentId(instance.getId());
            String splitterTypeName = agent.getDocumentSplitterType().getName();
            DocumentSplitter documentSplitter = serviceSelector.getDocumentSplitterByName(splitterTypeName);

            if (documentSplitter == null) {
                throw new GendoxException("DOCUMENT_SPLITTER_NOT_FOUND", "Document splitter not found with name: " + splitterTypeName, HttpStatus.NOT_FOUND);
            }

            contentSections = documentSplitter.split(fileContent);

        } catch (
                Exception e) {
            logger.warn("Error {} split document to sections {}. Skipping...", e.getMessage(), instance.getId());
            return null;
        }


        return new DocumentSectionDTO(instance, contentSections, documentUpdated);
    }
}

