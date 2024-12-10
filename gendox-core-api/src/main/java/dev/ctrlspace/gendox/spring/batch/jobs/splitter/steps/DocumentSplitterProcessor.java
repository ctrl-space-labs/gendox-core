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
        logger.trace("Start processing document: {}", instance.getId());

        try {
            // Step 1: Fetch content
            String fileContent = fetchContent(instance);

            // Step 2: Skip unchanged documents if applicable
            if (!hasDocumentChanged(instance, fileContent)) {
                logger.trace("No changes detected for document {}. Skipping processing.", instance.getId());
                return null;
            }

            // Step 3: Split content into sections
            List<String> contentSections = splitContent(instance, fileContent);

            return new DocumentSectionDTO(instance, contentSections, true);

        } catch (Exception e) {
            logger.warn("Error processing document {}: {}", instance.getId(), e.getMessage());
            return null; // Skip processing on errors
        }
    }

    private String fetchContent(DocumentInstance instance) throws GendoxException, Exception {
        if ("API_INTEGRATION_FILE".equals(instance.getFileType().getName())) {
            OrganizationWebSite organizationWebSite = organizationWebSiteService.getOrganizationWebSite(
                    instance.getOrganizationId(),
                    instance.getRemoteUrl()
            );

            ApiKey apiKey = apiKeyService.getById(organizationWebSite.getApiKeyId());
            return gendoxAPIIntegrationService.getContentById(instance.getRemoteUrl(), tempApiKey).getContent();
        }

        return downloadService.readDocumentContent(instance.getRemoteUrl());
    }

    private boolean hasDocumentChanged(DocumentInstance instance, String fileContent) throws GendoxException, Exception {
        if (Boolean.TRUE.equals(skipUnchangedDocs)) {
            String newHash = cryptographyUtils.calculateSHA256(fileContent);
            if (newHash.equals(instance.getDocumentSha256Hash())) {
                return false; // No changes detected
            }
            instance.setDocumentSha256Hash(newHash); // Update the hash
        }
        return true;
    }

    private List<String> splitContent(DocumentInstance instance, String fileContent) throws GendoxException {
        ProjectAgent agent = projectAgentService.getAgentByDocumentId(instance.getId());
        DocumentSplitter splitter = serviceSelector.getDocumentSplitterByName(agent.getDocumentSplitterType().getName());

        if (splitter == null) {
            throw new GendoxException(
                    "DOCUMENT_SPLITTER_NOT_FOUND",
                    "No document splitter found for agent " + agent.getId(),
                    HttpStatus.NOT_FOUND
            );
        }

        return splitter.split(fileContent);
    }



}

