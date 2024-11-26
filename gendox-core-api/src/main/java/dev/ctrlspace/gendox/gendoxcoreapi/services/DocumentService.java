package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.DocumentPredicates;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DocumentService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentService.class);

    private DocumentInstanceRepository documentInstanceRepository;
    private DocumentInstanceSectionRepository documentInstanceSectionRepository;
    private DocumentSectionService documentSectionService;

    private ProjectDocumentService projectDocumentService;

    private TypeService typeService;

    private AuditLogsService auditLogsService;

//    private IsccCodeService isccCodeService;


    @Autowired
    public DocumentService(DocumentInstanceRepository documentInstanceRepository,
                           DocumentSectionService documentSectionService,
                           DocumentInstanceSectionRepository documentInstanceSectionRepository,
                           ProjectDocumentService projectDocumentService,
                           TypeService typeService,
                           AuditLogsService auditLogsService) {

        this.documentInstanceRepository = documentInstanceRepository;
        this.documentSectionService = documentSectionService;
        this.projectDocumentService = projectDocumentService;
        this.documentInstanceSectionRepository = documentInstanceSectionRepository;
        this.typeService = typeService;
        this.auditLogsService = auditLogsService;
    }


    public DocumentInstance getDocumentInstanceById(UUID id) throws GendoxException {
        return documentInstanceRepository.findDocumentInstanceById(id)
                .orElseThrow(() -> new GendoxException("DOCUMENT_NOT_FOUND", "Document not found with id: " + id, HttpStatus.NOT_FOUND));

    }


    public Page<DocumentInstance> getAllDocuments(DocumentCriteria criteria) throws GendoxException {
        return this.getAllDocuments(criteria, PageRequest.of(0, 100));
    }


    public Page<DocumentInstance> getAllDocuments(DocumentCriteria criteria, Pageable pageable) throws GendoxException {
//        if (pageable == null) {
//            throw new GendoxException("Pageable cannot be null", "pageable.null", HttpStatus.BAD_REQUEST);
//        }
        return documentInstanceRepository.findAll(DocumentPredicates.build(criteria), pageable);

    }

    public DocumentInstance getDocumentByFileName(UUID projectId, UUID organizationId, String fileName) throws GendoxException {
        return documentInstanceRepository.findByProjectIdAndOrganizationIdAndFileName(projectId, organizationId, fileName)
                .orElse(null);
    }

    public DocumentInstance getDocumentByProjectIdAndOrganizationIdAndTitle(UUID projectId, DocumentInstance instance) throws GendoxException {
        return documentInstanceRepository.findByProjectIdAndOrganizationIdAndTitle(projectId, instance.getOrganizationId(), instance.getTitle())
                .orElse(null);
    }


    public DocumentInstance createDocumentInstance(DocumentInstance documentInstance) throws GendoxException {


        if (documentInstance.getId() == null) {
            documentInstance.setId(UUID.randomUUID());
        }

        // Save the DocumentInstance first to save its ID
        documentInstance = documentInstanceRepository.save(documentInstance);

        return documentInstance;
    }

    @Transactional
    public DocumentInstance updateDocument(DocumentInstance updatedDocument) throws GendoxException {
        UUID documentId = updatedDocument.getId();
        DocumentInstance existingDocument = this.getDocumentInstanceById(documentId);
        existingDocument.setDocumentTemplateId(updatedDocument.getDocumentTemplateId());
        existingDocument.setRemoteUrl(updatedDocument.getRemoteUrl());
        existingDocument.setDocumentIsccCode(updatedDocument.getDocumentIsccCode());
        existingDocument.setTitle(updatedDocument.getTitle());
        existingDocument.setFileType(updatedDocument.getFileType());
        if (updatedDocument.getContentId() != null) {
            existingDocument.setContentId(updatedDocument.getContentId());
        }
        if (updatedDocument.getUpdatedBy() != null) {
            existingDocument.setUpdatedBy(updatedDocument.getUpdatedBy());
        }
        existingDocument.setUpdatedAt(Instant.now());

        existingDocument = documentInstanceRepository.save(existingDocument);
        // TODO Giannis: I remove this because it is not necessary to update the sections here
//        updateExistingSectionsList(updatedDocument, existingDocument);

        return existingDocument;
    }


    /**
     * Gets the list of sections to be updated, added or deleted from the existing document
     * Adds new section to the list of existing sections
     * Updates existing sections
     * Deletes sections not available in the updated document
     *
     * @param updatedDocument
     * @param existingDocument
     */
    // TODO Giannis: This should be moved to the DocumentSectionService
    private void updateExistingSectionsList(DocumentInstance updatedDocument, DocumentInstance existingDocument) throws GendoxException {
        Set<String> existingSectionIds = existingDocument.getDocumentInstanceSections().stream()
                .map(DocumentInstanceSection::getId)
                .map(UUID::toString)
                .collect(Collectors.toSet());
        Set<String> updatedSectionIds = updatedDocument.getDocumentInstanceSections().stream()
                .map(DocumentInstanceSection::getId)
                .filter(Objects::nonNull)
                .map(UUID::toString)
                .collect(Collectors.toSet());

        for (DocumentInstanceSection updatedSection : updatedDocument.getDocumentInstanceSections()) {
            if (updatedSection.getId() != null && existingSectionIds.contains(updatedSection.getId().toString())) {
                documentSectionService.updateSection(updatedSection);
            } else {
                // Add new sections
                updatedSection.setDocumentInstance(existingDocument);
                documentSectionService.createNewSection(existingDocument, updatedSection.getSectionValue(), updatedSection.getDocumentSectionMetadata().getTitle());
            }
        }

        for (DocumentInstanceSection existingSection : existingDocument.getDocumentInstanceSections()) {
            if (!updatedSectionIds.contains(existingSection.getId().toString())) {
                //delete section
                documentSectionService.deleteSection(existingSection);
            }
        }

    }


    public void deleteDocument(UUID documentIid, UUID projectId) throws GendoxException {
        DocumentInstance documentInstance = getDocumentInstanceById(documentIid);
        deleteDocument(documentInstance, projectId);

    }

    public void deleteDocument(DocumentInstance documentInstance, UUID projectId) throws GendoxException {
        documentSectionService.deleteSections(documentInstance.getDocumentInstanceSections());
        projectDocumentService.deleteProjectDocument(documentInstance.getId(), projectId);
        documentInstance.getDocumentInstanceSections().clear();
        documentInstanceRepository.delete(documentInstance);

        //delete Document Auditing
        Type deleteDocumentType = typeService.getAuditLogTypeByName("DOCUMENT_DELETE");
        AuditLogs deleteDocumentAuditLogs = auditLogsService.createDefaultAuditLogs(deleteDocumentType);
        deleteDocumentAuditLogs.setProjectId(projectId);
        deleteDocumentAuditLogs.setOrganizationId(documentInstance.getOrganizationId());

        auditLogsService.saveAuditLogs(deleteDocumentAuditLogs);

    }

    public DocumentInstance saveDocumentInstance(DocumentInstance documentInstance) {
        return documentInstanceRepository.save(documentInstance);
    }


    @Transactional
    public void deleteAllDocumentInstances(List<UUID> documentIds) throws GendoxException {
        if (documentIds == null || documentIds.isEmpty()) {
            throw new GendoxException("INVALID_INPUT", "Document IDs list cannot be null or empty", HttpStatus.BAD_REQUEST);
        }
        for (UUID documentId : documentIds) {
            UUID projectId = projectDocumentService.getProjectIdByDocumentId(documentId);
            try {
                this.deleteDocument(documentId, projectId);
                logger.info("Successfully deleted all provided DocumentInstances.");
            } catch (Exception e) {
                logger.error("Failed to delete DocumentInstances with IDs: {}", documentIds, e);
                throw new GendoxException("DELETE_FAILED", "Failed to delete document instances", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }


    }


}
