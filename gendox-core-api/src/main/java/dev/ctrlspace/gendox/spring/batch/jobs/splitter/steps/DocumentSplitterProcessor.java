package dev.ctrlspace.gendox.spring.batch.jobs.splitter.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DownloadService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectAgentService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.ServiceSelector;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.documents.DocumentSplitter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Autowired
    public DocumentSplitterProcessor(ServiceSelector serviceSelector,
                                     ProjectAgentService projectAgentService,
                                     DownloadService downloadService) {
        this.serviceSelector = serviceSelector;
        this.projectAgentService = projectAgentService;
        this.downloadService = downloadService;
    }

    @Override
    public DocumentSectionDTO process(DocumentInstance item) throws Exception {
        List<String> contentSections = new ArrayList<>();
        ProjectAgent agent = new ProjectAgent();
        logger.debug("Start processing split: {}", item.getId());

        try {
            String fileContent = downloadService.readDocumentContent(item.getRemoteUrl());
            agent = projectAgentService.getAgentByDocumentId(item.getId());

            String splitterTypeName = agent.getDocumentSplitterType().getName();

            DocumentSplitter documentSplitter = serviceSelector.getDocumentSplitterByName(splitterTypeName);
            if (documentSplitter == null) {
                throw new GendoxException("DOCUMENT_SPLITTER_NOT_FOUND", "Document splitter not found with name: " + splitterTypeName, HttpStatus.NOT_FOUND);
            }

            contentSections = documentSplitter.split(fileContent);

        } catch (
                Exception e) {
            logger.warn("Error {} split document to sections {}. Skipping...", e.getMessage(), item.getId());
            return null;
        }


        return new DocumentSectionDTO(item, contentSections);
    }
}

