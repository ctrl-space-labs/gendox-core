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
    private CryptographyUtils cryptographyUtils;
    private DocumentService documentService;


    @Value("#{jobParameters['splitAllDocuments']}")
    protected Boolean splitAllDocuments;

    @Autowired
    public DocumentSplitterProcessor(ServiceSelector serviceSelector,
                                     ProjectAgentService projectAgentService,
                                     DownloadService downloadService,
                                     CryptographyUtils cryptographyUtils,
                                     DocumentService documentService) {
        this.serviceSelector = serviceSelector;
        this.projectAgentService = projectAgentService;
        this.downloadService = downloadService;
        this.cryptographyUtils = cryptographyUtils;
        this.documentService =  documentService;
    }

    @Override
    public DocumentSectionDTO process(DocumentInstance item) throws Exception {
        List<String> contentSections = new ArrayList<>();
        ProjectAgent agent = new ProjectAgent();
        logger.trace("Start processing split: {}", item.getId());

        try {
            String fileContent = downloadService.readDocumentContent(item.getRemoteUrl());

            // SHA-256 hash check only if splitAllDocuments is false
            if (Boolean.FALSE.equals(splitAllDocuments)) {
                String documentSha256Hash = cryptographyUtils.calculateSHA256(fileContent);
                logger.trace("SHA-256 hash of document {}: {}", item.getId(), documentSha256Hash);

                // If hashes match, content hasn't changed; skip splitting
                if (documentSha256Hash.equals(item.getDocumentSha256Hash())) {
                    logger.trace("No changes detected for document {}. Skipping split.", item.getId());
                    return null;
                }

                // Update hash to the new value since content has changed
                item.setDocumentSha256Hash(documentSha256Hash);
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

            documentService.saveDocumentInstance(item);

        } catch (Exception e) {
            logger.warn("Error {} splitting document to sections {}. Skipping...", e.getMessage(), item.getId());
            return null;
        }

        return new DocumentSectionDTO(item, contentSections);
    }
}

