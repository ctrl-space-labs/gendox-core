package dev.ctrlspace.gendox.spring.batch.jobs.splitter.steps;

import com.knuddels.jtokkit.api.Encoding;
import com.knuddels.jtokkit.api.EncodingRegistry;
import com.knuddels.jtokkit.api.ModelType;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ApiKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationWebSite;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.CryptographyUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.ServiceSelector;
import dev.ctrlspace.gendox.integrations.gendox.api.model.dto.ContentDTO;
import dev.ctrlspace.gendox.integrations.gendox.api.services.GendoxAPIIntegrationService;
import jakarta.annotation.Nullable;
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


import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

@Component
@StepScope
public class DocumentSplitterProcessor implements ItemProcessor<DocumentInstance, DocumentSectionDTO> {

    private final SplitFileService splitFileService;
    Logger logger = LoggerFactory.getLogger(DocumentSplitterProcessor.class);
    @Value("#{jobParameters['skipUnchangedDocs']}")
    protected Boolean skipUnchangedDocs;
    @Value("#{jobParameters['projectId']}")
    private String projectIdParam;
    @PersistenceContext
    private EntityManager entityManager;

    private ServiceSelector serviceSelector;
    private ProjectAgentService projectAgentService;
    private ProjectService projectService;
    private DocumentDigitizationService documentDigitizationService;
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
                                     ProjectService projectService,
                                     DocumentDigitizationService documentDigitizationService,
                                     DownloadService downloadService,
                                     GendoxAPIIntegrationService gendoxAPIIntegrationService,
                                     CryptographyUtils cryptographyUtils,
                                     ApiKeyService apiKeyService,
                                     OrganizationWebSiteService organizationWebSiteService,
                                     EncodingRegistry encodingRegistry,
                                     SplitFileService splitFileService) {
        this.serviceSelector = serviceSelector;
        this.projectAgentService = projectAgentService;
        this.projectService = projectService;
        this.documentDigitizationService = documentDigitizationService;
        this.downloadService = downloadService;
        this.gendoxAPIIntegrationService = gendoxAPIIntegrationService;
        this.cryptographyUtils = cryptographyUtils;
        this.apiKeyService = apiKeyService;
        this.organizationWebSiteService = organizationWebSiteService;
        this.encodingRegistry = encodingRegistry;

        this.enc = encodingRegistry.getEncodingForModel(ModelType.GPT_4O);
        this.splitFileService = splitFileService;
    }


    @Override
    public DocumentSectionDTO process(DocumentInstance instance) throws Exception {
        logger.trace("Start processing document: {}", instance.getId());
        String tempFilePrefix = "splitter-" + UUID.randomUUID();
        Path file = null;

        try {
            // TODO DocumentSectionService#splitDocumentAndCreateSections also is splitting the document,
            //   merge those methods somehow. The challenge is that this job is performant for 1000s of documents,
            //   by separating the splitting and the writing. While the service method is performant for single documents

            // A stored document is read from one local copy, downloaded fresh under a name of its own,
            // since downloadToTemp reuses any file already there with the same name
            boolean apiIntegration = isApiIntegration(instance);
            boolean digitize = !apiIntegration && isAutoDigitized();
            if (!apiIntegration) {
                file = downloadService.downloadToTemp(instance.getRemoteUrl(), tempFilePrefix);
            }

            // Digitized text differs on every run, so a digitized document is compared by its original file,
            // before its pages are sent to the LLM
            String fileHash = digitize ? cryptographyUtils.calculateSHA256(file) : null;
            if (fileHash != null && Boolean.TRUE.equals(skipUnchangedDocs) && fileHash.equals(instance.getDocumentSha256Hash())) {
                logger.trace("No changes detected for document {}. Skipping digitization.", instance.getId());
                return null;
            }

            // Step 1: Fetch content
            String fileContent = fetchContent(instance, digitize, file);

            // Step 2: Skip unchanged documents if applicable
            if (!hasDocumentChanged(instance, fileContent, fileHash)) {
                logger.trace("No changes detected for document {}. Skipping processing.", instance.getId());
                return null;
            }

            // Stop JPA/Hibernate from tracking this instance. It will be saved in Writer if updated.
            entityManager.detach(instance);

            // using gpt-4o encoding for token counting - not perfect but good enough approximation for all models
            int totalTokens = enc.countTokens(fileContent);
            instance.setTotalTokens((long)totalTokens);

            // Step 3: Split content into sections
            List<String> contentSections = splitFileService.splitDocument(instance, fileContent);

            return new DocumentSectionDTO(instance, contentSections, true);

        } catch (Exception e) {
            logger.warn("Error processing document {}: {}", instance.getId(), e.getMessage());
            return null; // Skip processing on errors
        } finally {
            if (file != null) {
                // the download and the files made from it, such as a DOCX's PDF
                downloadService.deleteTempFiles(tempFilePrefix);
            }
        }
    }

    /**
     * @param digitize whether the content comes from the LLM, page by page
     * @param file     the local copy of a stored document; null for API integration content
     */
    private String fetchContent(DocumentInstance instance, boolean digitize, @Nullable Path file) throws GendoxException, Exception {
        if (isApiIntegration(instance)) {
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
            instance.setExternalUrl(contentDTO.getSource());
            return contentDTO.getContent();
        }

        // Pass it from LLM if the AutoDigitization is enabled for the project, basically the same code as the Digitization Task
        if (digitize) {
            return documentDigitizationService.digitizeDocumentToText(
                    instance,
                    projectService.getProjectById(UUID.fromString(projectIdParam)),
                    DocumentDigitizationService.DEFAULT_DIGITIZATION_PROMPT,
                    file);
        }

        return downloadService.readDocumentContent(instance.getRemoteUrl(), file);
    }

    private static boolean isApiIntegration(DocumentInstance instance) {
        return "API_INTEGRATION_FILE".equals(instance.getFileType().getName());
    }

    private boolean isAutoDigitized() {
        if (projectIdParam == null) {
            return false;
        }
        ProjectAgent agent = projectAgentService.getAgentByProjectId(UUID.fromString(projectIdParam));
        return agent != null && Boolean.TRUE.equals(agent.getAutoDigitization());
    }

    /**
     * @param fileHash the original file's hash, used instead of the content's when given
     */
    private boolean hasDocumentChanged(DocumentInstance instance, String fileContent, @Nullable String fileHash) throws GendoxException, Exception {
        if (Boolean.TRUE.equals(skipUnchangedDocs)) {
            String newHash = fileHash != null ? fileHash : cryptographyUtils.calculateSHA256(fileContent);
            if (newHash.equals(instance.getDocumentSha256Hash())) {
                return false; // No changes detected
            }
            instance.setDocumentSha256Hash(newHash); // Update the hash
        }
        return true;
    }


}

