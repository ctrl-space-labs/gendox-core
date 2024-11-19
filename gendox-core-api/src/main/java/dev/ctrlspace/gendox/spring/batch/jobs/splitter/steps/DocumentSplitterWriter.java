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

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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

        logger.debug("Start writing sections chunk");

        Set<DocumentInstance> updatedDocuments = new HashSet<>();

        for (DocumentSectionDTO documentSectionDTO : chunk.getItems()) {
            logger.debug("Create {} Sections for document instance: {}",
                    documentSectionDTO.contentSections().size(),
                    documentSectionDTO.documentInstance().getId());
            List<DocumentInstanceSection> documentSections =
                    documentSectionService.createSections(documentSectionDTO.documentInstance(), documentSectionDTO.contentSections());

            if (documentSectionDTO.documentUpdated()) {
                updatedDocuments.add(documentSectionDTO.documentInstance());
            }



            //update Document Sections Auditing
            Type updateDocumentType = typeService.getAuditLogTypeByName("CREATE_DOCUMENT_SECTIONS");
            AuditLogs updateDocumentAuditLogs = auditLogsService.createDefaultAuditLogs(updateDocumentType);
            updateDocumentAuditLogs.setOrganizationId(documentSectionDTO.documentInstance().getOrganizationId());
            // TODO this is for auditing reasons, it doesn't worth it to do an extra query to get the project id
            //  if it become necessary, we can add a project id to the DocumentSectionDTO
            updateDocumentAuditLogs.setProjectId(null);

            auditLogsService.saveAuditLogs(updateDocumentAuditLogs);

        }

        for (DocumentInstance documentInstance : updatedDocuments) {
            documentService.updateDocument(documentInstance);
        }
    }
}


