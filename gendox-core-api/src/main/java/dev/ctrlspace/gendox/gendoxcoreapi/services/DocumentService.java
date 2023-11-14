package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Gpt35ModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.DocumentPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class DocumentService {

    private DocumentInstanceRepository documentInstanceRepository;
    private DocumentSectionMetadataRepository documentSectionMetadataRepository;
    private SecurityUtils securityUtils;
    private TrainingService trainingService;
    private DocumentSectionService documentSectionService;

    @Autowired
    public DocumentService(DocumentInstanceRepository documentInstanceRepository,
                           DocumentSectionMetadataRepository documentSectionMetadataRepository,
                           SecurityUtils securityUtils,
                           TrainingService trainingService,
                           DocumentSectionService documentSectionService) {
        this.documentInstanceRepository = documentInstanceRepository;
        this.documentSectionMetadataRepository = documentSectionMetadataRepository;
        this.securityUtils = securityUtils;
        this.trainingService = trainingService;
        this.documentSectionService = documentSectionService;
    }


    public DocumentInstance getDocumentInstanceById(UUID id) throws GendoxException {
        return documentInstanceRepository.findById(id)
                .orElseThrow(() -> new GendoxException("DOCUMENT_NOT_FOUND", "Document not found with id: " + id, HttpStatus.NOT_FOUND));

    }


    public Page<DocumentInstance> getAllDocuments(DocumentCriteria criteria) throws GendoxException {
        return this.getAllDocuments(criteria, PageRequest.of(0, 100));
    }


    public Page<DocumentInstance> getAllDocuments(DocumentCriteria criteria, Pageable pageable) throws GendoxException {
        if (pageable == null) {
            throw new GendoxException("Pageable cannot be null", "pageable.null", HttpStatus.BAD_REQUEST);
        }
        return documentInstanceRepository.findAll(DocumentPredicates.build(criteria), pageable);

    }

    public DocumentInstance createDocumentInstance(DocumentInstance documentInstance) throws GendoxException {
        Instant now = Instant.now();

        if (documentInstance.getId() == null) {
            documentInstance.setId(UUID.randomUUID());
        }

        documentInstance.setCreatedAt(now);
        documentInstance.setUpdatedAt(now);
        documentInstance.setCreatedBy(securityUtils.getUserId());
        documentInstance.setUpdatedBy(securityUtils.getUserId());

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
        existingDocument.setDocumentInstanceSections(documentSectionService.updateSections(documentInstance));
        existingDocument.setUpdatedBy(securityUtils.getUserId());
        existingDocument.setUpdatedAt(Instant.now());

        existingDocument = documentInstanceRepository.save(existingDocument);

        return existingDocument;
    }




    public void deleteDocument(UUID id) throws GendoxException {
        DocumentInstance documentInstance = this.getDocumentInstanceById(id);
        documentSectionService.deleteSections(documentInstance.getDocumentInstanceSections());
        documentInstanceRepository.delete(documentInstance);
    }





}
