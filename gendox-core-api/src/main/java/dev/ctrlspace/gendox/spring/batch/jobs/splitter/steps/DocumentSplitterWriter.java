package dev.ctrlspace.gendox.spring.batch.jobs.splitter.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.model.AuditLogs;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.services.AuditLogsService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentSectionService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TypeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.Chunk;
import org.springframework.batch.item.ItemWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@StepScope
public class DocumentSplitterWriter implements ItemWriter<DocumentSectionDTO> {

    private DocumentSectionService documentSectionService;
    private TypeService typeService;
    private AuditLogsService auditLogsService;
    private DocumentService documentService;

    @Autowired
    public DocumentSplitterWriter(DocumentSectionService documentSectionService,
                                   TypeService typeService,
                                   AuditLogsService auditLogsService,
                                   DocumentService documentService) {
        this.documentSectionService = documentSectionService;
        this.typeService = typeService;
        this.auditLogsService = auditLogsService;
        this.documentService = documentService;
    }


    Logger logger = LoggerFactory.getLogger(DocumentSplitterWriter.class);

    @Override
    public void write(Chunk<? extends DocumentSectionDTO> chunk) throws Exception {

        logger.debug("Start writing sections chunk {} items", chunk.getItems().size());


        for (DocumentSectionDTO documentSectionDTO : chunk.getItems()) {
            logger.debug("Create {} Sections for document instance: {}",
                    documentSectionDTO.contentSections().size(),
                    documentSectionDTO.documentInstance().getId());

            // fetch fresh DocumentInstance since the param has been detached from hibernate session
            DocumentInstance freshDoc = documentService.getDocumentInstanceById(documentSectionDTO.documentInstance().getId());
            freshDoc.setDocumentSha256Hash(documentSectionDTO.documentInstance().getDocumentSha256Hash());
            freshDoc.setTotalTokens(documentSectionDTO.documentInstance().getTotalTokens());
            if (documentSectionDTO.documentUpdated()) {
                documentService.saveDocumentInstance(freshDoc);
            }

            List<DocumentInstanceSection> documentSections =
                    documentSectionService.createSections(freshDoc, documentSectionDTO.contentSections());

            long documentSectionCount = documentSections.size();

            //update Document Sections Auditing
             auditLogsService.createAuditLog(documentSectionDTO.documentInstance().getOrganizationId(),
                    null,"CREATE_DOCUMENT_SECTIONS",documentSectionCount);
//            // TODO this is for auditing reasons, it doesn't worth it to do an extra query to get the project id


        }

    }
}


