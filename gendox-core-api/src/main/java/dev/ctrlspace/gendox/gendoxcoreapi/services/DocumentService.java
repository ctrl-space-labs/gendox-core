package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.DocumentPredicates;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DocumentService {

    private DocumentInstanceRepository documentInstanceRepository;
    private DocumentInstanceSectionRepository documentInstanceSectionRepository;
    private DocumentSectionService documentSectionService;

    private ProjectDocumentService projectDocumentService;

    @Autowired
    public DocumentService(DocumentInstanceRepository documentInstanceRepository,
                           DocumentSectionService documentSectionService,
                           DocumentInstanceSectionRepository documentInstanceSectionRepository,
                           ProjectDocumentService projectDocumentService) {
        this.documentInstanceRepository = documentInstanceRepository;
        this.documentSectionService = documentSectionService;
        this.projectDocumentService = projectDocumentService;
        this.documentInstanceSectionRepository = documentInstanceSectionRepository;
    }


    public DocumentInstance getDocumentInstanceById(UUID id) throws GendoxException {
        return documentInstanceRepository.findById(id)
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




    public DocumentInstance createDocumentInstance(DocumentInstance documentInstance) throws GendoxException {


        if (documentInstance.getId() == null) {
            documentInstance.setId(UUID.randomUUID());
        }

        // Save the DocumentInstance first to save its ID
        documentInstance = documentInstanceRepository.save(documentInstance);

        return documentInstance;
    }

    public DocumentInstance updateDocument(DocumentInstance updatedDocument) throws GendoxException {
        UUID documentId = updatedDocument.getId();
        DocumentInstance existingDocument = this.getDocumentInstanceById(documentId);

        // Update the properties of the existingDocument with the values from the updated document
        existingDocument.setDocumentTemplateId(updatedDocument.getDocumentTemplateId());
        existingDocument.setRemoteUrl(updatedDocument.getRemoteUrl());
        existingDocument.setUpdatedBy(updatedDocument.getUpdatedBy());
        existingDocument.setUpdatedAt(Instant.now());

        existingDocument = documentInstanceRepository.save(existingDocument);
        updateExistingSectionsList(updatedDocument, existingDocument);

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
        documentSectionService.deleteSections(documentInstance.getDocumentInstanceSections());
        projectDocumentService.deleteProjectDocument(documentIid, projectId);
        documentInstanceRepository.delete(documentInstance);
    }

    public void deleteDocument(DocumentInstance documentInstance, UUID projectId) throws GendoxException {
        documentSectionService.deleteSections(documentInstance.getDocumentInstanceSections());
        projectDocumentService.deleteProjectDocument(documentInstance.getId(), projectId);
        documentInstance.setDocumentInstanceSections(null);
        documentInstanceRepository.delete(documentInstance);
    }





}
