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

import java.time.Instant;
import java.util.UUID;

@Service
public class DocumentService {

    private DocumentInstanceRepository documentInstanceRepository;
    private DocumentSectionService documentSectionService;

    private ProjectDocumentService projectDocumentService;

    @Autowired
    public DocumentService(DocumentInstanceRepository documentInstanceRepository,
                           DocumentSectionService documentSectionService,
                           ProjectDocumentService projectDocumentService) {
        this.documentInstanceRepository = documentInstanceRepository;
        this.documentSectionService = documentSectionService;
        this.projectDocumentService = projectDocumentService;
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

    public DocumentInstance updateDocument(DocumentInstance documentInstance) throws GendoxException {
        UUID documentId = documentInstance.getId();
        DocumentInstance existingDocument = this.getDocumentInstanceById(documentId);

        // Update the properties of the existingDocument with the values from the updated document
        existingDocument.setDocumentTemplateId(documentInstance.getDocumentTemplateId());
        existingDocument.setRemoteUrl(documentInstance.getRemoteUrl());
        existingDocument.setUpdatedBy(documentInstance.getUpdatedBy());

        existingDocument.setUpdatedAt(Instant.now());


        existingDocument = documentInstanceRepository.save(existingDocument);

        return existingDocument;
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
