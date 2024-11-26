package dev.ctrlspace.gendox.spring.batch.jobs.splitter.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DownloadService;
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
    private ServiceSelector serviceSelector;
    private ProjectAgentService projectAgentService;
    private DownloadService downloadService;
    private GendoxAPIIntegrationService gendoxAPIIntegrationService;
    private CryptographyUtils cryptographyUtils;


    @Value("#{jobParameters['skipUnchangedDocs']}")
    protected Boolean skipUnchangedDocs;

    @Autowired
    public DocumentSplitterProcessor(ServiceSelector serviceSelector,
                                     ProjectAgentService projectAgentService,
                                     DownloadService downloadService,
                                     CryptographyUtils cryptographyUtils) {
                                     DownloadService downloadService,
                                     GendoxAPIIntegrationService gendoxAPIIntegrationService) {
        this.serviceSelector = serviceSelector;
        this.projectAgentService = projectAgentService;
        this.downloadService = downloadService;
        this.cryptographyUtils = cryptographyUtils;
        this.gendoxAPIIntegrationService = gendoxAPIIntegrationService;
    }

    String baseUrl = "https://test.dma.com.gr/wp-json";
    String apiKey = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJDR0NpMlNTX2lQNkdGYTBKQmVqRjAxYzNpcDBTdm43d2FLMGNYQnJHR19RIn0.eyJleHAiOjE3MzI0MDE1NjgsImlhdCI6MTczMjM1ODM2OCwiYXV0aF90aW1lIjoxNzMyMzU4MzY3LCJqdGkiOiJkNDU4MjliZi03YzQ0LTRlMmQtYTZkNS1hOGMxNzk4ZGQzNTUiLCJpc3MiOiJodHRwczovL2Rldi5nZW5kb3guY3RybHNwYWNlLmRldi9pZHAvcmVhbG1zL2dlbmRveC1pZHAtZGV2IiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjEyYjYwNGQ4LTk1OTktNDk3ZS05ZDA4LTAwYjdkZmQ5ZmVkMiIsInR5cCI6IkJlYXJlciIsImF6cCI6ImdlbmRveC1wa2NlLXB1YmxpYy1jbGllbnQtZGV2Iiwic2lkIjoiZTFhM2Y5NDgtZjkzNy00N2NkLWI2M2QtZDRhZjk4OTZhZGY3IiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyJodHRwczovL2Rldi5nZW5kb3guY3RybHNwYWNlLmRldiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiZGVmYXVsdC1yb2xlcy1nZW5kb3gtaWRwLWRldiIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBlbWFpbCBwcm9maWxlIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJBY2NvdW50IG9uZSBUZXN0QWNjb3VudCAiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzZWxvbW81MDA5QGV4d2VtZS5jb20iLCJnaXZlbl9uYW1lIjoiQWNjb3VudCBvbmUiLCJmYW1pbHlfbmFtZSI6IlRlc3RBY2NvdW50ICIsImVtYWlsIjoic2Vsb21vNTAwOUBleHdlbWUuY29tIn0.g5q4vjxCo7hv-l_NIEKxetNEvny7nlzmmjWHHZDfXbFekcDLaB9qFLM9oZYDvU2FwmT9rM3lNKORp6nnVw2x6DFfecWo1m0of6Ov5md04onu5OdSvDhYHzcwjROXGX5-8zNJxi65ZIpCBXWJmZdKhAs0pIWdYB6USGFzWkfqUpqtw4UnypUgqckDFVOYLLswfY8fpGYiJnimPvwCy-DLPpVS6Ic97UgwrGSTcievQOielLUokyGGzS6igSJLw93y24ZAwEytt8whPLAeuPqPRUoNrNN2leZK2tAzrpHsso5cPb6SQ-mSGFFbHDBcbdC_1RcGbm7qsHQu_jxv37K2_Q";

    @Override
    public DocumentSectionDTO process(DocumentInstance item) throws Exception {
        List<String> contentSections = new ArrayList<>();
        ProjectAgent agent = new ProjectAgent();
        Boolean documentUpdated = false;
        logger.trace("Start processing split: {}", item.getId());


        try {
            String fileContent = null;

            fileContent = (item.getFileType() == null || !"API_INTEGRATION_FILE".equals(item.getFileType().getName()))
                    ? downloadService.readDocumentContent(item.getRemoteUrl())
                    : gendoxAPIIntegrationService.getContentById(baseUrl, item.getContentId(), apiKey).getContent();

            if (item.getFileType() == null) {
                logger.warn("DocumentInstance {} has a null fileType. Using remoteUrl to retrieve content.", item.getId());
            }


            String fileContent = downloadService.readDocumentContent(item.getRemoteUrl());

            // SHA-256 hash check only if splitAllDocuments is false
            if (Boolean.TRUE.equals(skipUnchangedDocs)) {
                String documentSha256Hash = cryptographyUtils.calculateSHA256(fileContent);
                logger.trace("SHA-256 hash of document {}: {}", item.getId(), documentSha256Hash);

                // If hashes match, content hasn't changed; skip splitting
                if (documentSha256Hash.equals(item.getDocumentSha256Hash())) {
                    logger.trace("No changes detected for document {}. Skipping split.", item.getId());
                    return null;
                }

                // Update hash to the new value since content has changed
                item.setDocumentSha256Hash(documentSha256Hash);
                documentUpdated = true;
            } else {
                logger.trace("splitAllDocuments is true, skipping SHA-256 check for document {}.", item.getId());
            }

            // Fetch the project agent by document ID
            agent = projectAgentService.getAgentByDocumentId(item.getId());
            String splitterTypeName = agent.getDocumentSplitterType().getName();

            // Get the document splitter by name
            DocumentSplitter documentSplitter = serviceSelector.getDocumentSplitterByName(splitterTypeName);

            if (documentSplitter == null) {
                throw new GendoxException("DOCUMENT_SPLITTER_NOT_FOUND",
                        "Document splitter not found with name: " + splitterTypeName, HttpStatus.NOT_FOUND);
            }

            contentSections = documentSplitter.split(fileContent);


        } catch (Exception e) {
            logger.warn("Error {} splitting document to sections {}. Skipping...", e.getMessage(), item.getId());
            return null;
        }

        return new DocumentSectionDTO(item, contentSections, documentUpdated);
    }
}

