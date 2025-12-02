package dev.ctrlspace.gendox.spring.batch.jobs.splitter.steps;

import com.knuddels.jtokkit.api.Encoding;
import com.knuddels.jtokkit.api.EncodingRegistry;
import com.knuddels.jtokkit.api.ModelType;
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
import dev.ctrlspace.gendox.integrations.gendox.api.model.dto.ContentDTO;
import dev.ctrlspace.gendox.integrations.gendox.api.services.GendoxAPIIntegrationService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
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
import java.util.UUID;

@Component
@StepScope
public class DocumentSplitterProcessor implements ItemProcessor<DocumentInstance, DocumentSectionDTO> {

    Logger logger = LoggerFactory.getLogger(DocumentSplitterProcessor.class);
    @Value("#{jobParameters['skipUnchangedDocs']}")
    protected Boolean skipUnchangedDocs;
    @PersistenceContext
    private EntityManager entityManager;

    private ServiceSelector serviceSelector;
    private ProjectAgentService projectAgentService;
    private DownloadService downloadService;
    private GendoxAPIIntegrationService gendoxAPIIntegrationService;
    private CryptographyUtils cryptographyUtils;
    private ApiKeyService apiKeyService;
    private OrganizationWebSiteService organizationWebSiteService;
    private EncodingRegistry encodingRegistry;

    private Encoding enc;

    @Autowired
    public DocumentSplitterProcessor(ServiceSelector serviceSelector,
                                     ProjectAgentService projectAgentService,
                                     DownloadService downloadService,
                                     GendoxAPIIntegrationService gendoxAPIIntegrationService,
                                     CryptographyUtils cryptographyUtils,
                                     ApiKeyService apiKeyService,
                                     OrganizationWebSiteService organizationWebSiteService,
                                     EncodingRegistry encodingRegistry) {
        this.serviceSelector = serviceSelector;
        this.projectAgentService = projectAgentService;
        this.downloadService = downloadService;
        this.gendoxAPIIntegrationService = gendoxAPIIntegrationService;
        this.cryptographyUtils = cryptographyUtils;
        this.apiKeyService = apiKeyService;
        this.organizationWebSiteService = organizationWebSiteService;
        this.encodingRegistry = encodingRegistry;


        this.enc = encodingRegistry.getEncodingForModel(ModelType.GPT_4O);
    }


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

            // Stop JPA/Hibernate from tracking this instance. It will be saved in Writer if updated.
            entityManager.detach(instance);

            // using gpt-4o encoding for token counting - not perfect but good enough approximation for all models
            int totalTokens = enc.countTokens(fileContent);
            instance.setTotalTokens((long)totalTokens);

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
            UUID organizationId = instance.getOrganizationId();
            String domain = instance.getRemoteUrl();
            OrganizationWebSite organizationWebSite = organizationWebSiteService.getOrganizationWebSite(organizationId, domain);

            if (organizationWebSite == null) {
                logger.error("No matching OrganizationWebSite found for Organization ID: {}, Domain: {}", organizationId, domain);
                throw new GendoxException(
                        "ORGANIZATION_WEBSITE_NOT_FOUND",
                        "No matching OrganizationWebSite found with the specified criteria",
                        HttpStatus.NOT_FOUND
                );
            }

            ApiKey apiKey = apiKeyService.getById(organizationWebSite.getApiKeyId());
            ContentDTO contentDTO = gendoxAPIIntegrationService.getContentById(instance.getRemoteUrl(), apiKey.getApiKey());
            //update external url
            instance.setExternalUrl(contentDTO.getSource());
            return contentDTO.getContent();
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

