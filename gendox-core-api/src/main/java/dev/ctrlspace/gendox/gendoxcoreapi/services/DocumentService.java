package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.DocumentPredicates;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
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
    private DocumentSectionService documentSectionService;
    private ProjectDocumentService projectDocumentService;
    private TypeService typeService;
    private AuditLogsService auditLogsService;
    private SubscriptionValidationService subscriptionValidationService;
    private TaskNodeService taskNodeService;
    private EntityManager entityManager;
    private DownloadService downloadService;


    @Autowired
    public DocumentService(DocumentInstanceRepository documentInstanceRepository,
                           DocumentSectionService documentSectionService,
                           ProjectDocumentService projectDocumentService,
                           TypeService typeService,
                           AuditLogsService auditLogsService,
                           SubscriptionValidationService subscriptionValidationService,
                           EntityManager entityManager,
                           TaskNodeService taskNodeService,
                           DownloadService downloadService) {
        this.documentInstanceRepository = documentInstanceRepository;
        this.documentSectionService = documentSectionService;
        this.projectDocumentService = projectDocumentService;
        this.typeService = typeService;
        this.auditLogsService = auditLogsService;
        this.subscriptionValidationService = subscriptionValidationService;
        this.entityManager = entityManager;
        this.taskNodeService = taskNodeService;
        this.downloadService = downloadService;
    }


    public DocumentInstance getDocumentInstanceById(UUID id) throws GendoxException {
        return documentInstanceRepository.findDocumentInstanceById(id)
                .orElseThrow(() -> new GendoxException("DOCUMENT_NOT_FOUND", "Document not found with id: " + id, HttpStatus.NOT_FOUND));

    }


    public Page<DocumentInstance> getAllDocuments(DocumentCriteria criteria) throws GendoxException {
        return this.getAllDocuments(criteria, PageRequest.of(0, 100));
    }


    public Page<DocumentInstance> getAllDocuments(DocumentCriteria criteria, Pageable pageable) throws GendoxException {

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

    public DocumentInstance createDocumentInstance(DocumentInstance documentInstance) throws GendoxException, IOException {


        if (documentInstance.getId() == null) {
            documentInstance.setId(UUID.randomUUID());
        }

        // if file size bytes is null do it 0
        if (documentInstance.getFileSizeBytes() == null) {
            documentInstance.setFileSizeBytes(0L);
        }

        if (documentInstance.getRemoteUrl() != null && downloadService.isPdfUrl(documentInstance.getRemoteUrl())) {
            try {
                documentInstance.setNumberOfPages(downloadService.countDocumentPages(documentInstance.getRemoteUrl()));
            } catch (IOException e) {
                logger.error("Error counting document pages for document with ID: {}", documentInstance.getId(), e);
                throw new GendoxException("PAGE_COUNT_ERROR", "Error counting document pages", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } else {
            documentInstance.setNumberOfPages(null);
        }

//         Check if the organization has reached the maximum number of documents allowed
        if (!subscriptionValidationService.canCreateDocuments(documentInstance.getOrganizationId())) {
            throw new GendoxException("MAX_DOCUMENTS_REACHED", "Maximum number of documents reached for this organization", HttpStatus.BAD_REQUEST);
        }

        // Check if the organization has reached the maximum document size allowed
        if (!subscriptionValidationService.canCreateDocumentsSize(documentInstance.getOrganizationId(), documentInstance.getFileSizeBytes().intValue())) {
            throw new GendoxException("MAX_DOCUMENT_SIZE_REACHED", "Maximum document size reached for this organization", HttpStatus.BAD_REQUEST);
        }

//         Check if the organization has reached the maximum number of document sections allowed
//        if (!subscriptionValidationService.canCreateDocumentSections(documentInstance.getOrganizationId())) {
//            throw new GendoxException("MAX_DOCUMENT_SECTIONS_REACHED", "Maximum number of document sections reached for this organization", HttpStatus.BAD_REQUEST);
//        }

        // Save the DocumentInstance first to save its ID
        documentInstance = documentInstanceRepository.save(documentInstance);

        return documentInstance;
    }

    @Transactional
    public DocumentInstance updateDocument(DocumentInstance updatedDocument) throws GendoxException {
        UUID documentId = updatedDocument.getId();
        DocumentInstance existingDocument = this.getDocumentInstanceById(documentId);

        if (updatedDocument.getDocumentTemplateId() != null) {
            existingDocument.setDocumentTemplateId(updatedDocument.getDocumentTemplateId());
        }
        if (updatedDocument.getRemoteUrl() != null) {
            existingDocument.setRemoteUrl(updatedDocument.getRemoteUrl());
        }
        if (updatedDocument.getDocumentIsccCode() != null) {
            existingDocument.setDocumentIsccCode(updatedDocument.getDocumentIsccCode());
        }
        if (updatedDocument.getTitle() != null) {
            existingDocument.setTitle(updatedDocument.getTitle());
        }
        if (updatedDocument.getFileType() != null) {
            existingDocument.setFileType(updatedDocument.getFileType());
        }
        if (updatedDocument.getContentId() != null) {
            existingDocument.setContentId(updatedDocument.getContentId());
        }
        if (updatedDocument.getUpdatedBy() != null) {
            existingDocument.setUpdatedBy(updatedDocument.getUpdatedBy());
        }
        if (updatedDocument.getOrganizationId() != null) {
            existingDocument.setOrganizationId(updatedDocument.getOrganizationId());
        }
        if (updatedDocument.getExternalUrl() != null) {
            existingDocument.setExternalUrl(updatedDocument.getExternalUrl());
        }
        if (updatedDocument.getDocumentSha256Hash() != null) {
            existingDocument.setDocumentSha256Hash(updatedDocument.getDocumentSha256Hash());
        }
        if (updatedDocument.getFileSizeBytes() != null) {
            if (updatedDocument.getRemoteUrl() != null && downloadService.isPdfUrl(updatedDocument.getRemoteUrl())) {
                try {
                    updatedDocument.setNumberOfPages(downloadService.countDocumentPages(updatedDocument.getRemoteUrl()));
                } catch (IOException e) {
                    logger.error("Error counting document pages for document with ID: {}", updatedDocument.getId(), e);
                    throw new GendoxException("PAGE_COUNT_ERROR", "Error counting document pages", HttpStatus.INTERNAL_SERVER_ERROR);
                }
            }
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


    @Transactional
    public void deleteDocument(UUID documentIid, UUID projectId) throws GendoxException {
        DocumentInstance documentInstance = getDocumentInstanceById(documentIid);
        deleteDocument(documentInstance, projectId);
    }

    @Transactional
    public void deleteDocument(DocumentInstance documentInstance, UUID projectId) throws GendoxException {

        List<DocumentInstanceSection> managedSections = documentSectionService.getSectionsByDocument(documentInstance.getId());
        // Delete task nodes associated with this document
        taskNodeService.deleteDocumentNodeAndConnectionNodesByDocumentId(documentInstance.getId());
        documentSectionService.deleteSections(managedSections);

        // Delete any project-specific associations (make sure these are done in bulk too)
        projectDocumentService.deleteProjectDocument(documentInstance.getId(), projectId);

        // Continue with audit log deletion (unchanged)
        Type deleteDocumentType = typeService.getAuditLogTypeByName("DOCUMENT_DELETE");
        AuditLogs deleteDocumentAuditLogs = auditLogsService.createDefaultAuditLogs(deleteDocumentType);
        deleteDocumentAuditLogs.setProjectId(projectId);
        deleteDocumentAuditLogs.setOrganizationId(documentInstance.getOrganizationId());
        deleteDocumentAuditLogs.setAuditValue(documentInstance.getFileSizeBytes());

        auditLogsService.saveAuditLogs(deleteDocumentAuditLogs);
        documentInstanceRepository.delete(documentInstance);


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
                entityManager.flush();
                entityManager.clear();
                logger.info("Successfully deleted document Instance with ID: {}", documentId);
            } catch (Exception e) {
                logger.error("Failed to delete DocumentInstances with IDs: {}", documentIds, e);
                throw new GendoxException("DELETE_FAILED", "Failed to delete document instances", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }


    }


}
