package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentSectionMetadata;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceSectionRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentSectionMetadataRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.DocumentPredicates;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class DocumentService {

    private DocumentInstanceRepository documentInstanceRepository;
    private DocumentInstanceSectionRepository documentInstanceSectionRepository;
    private DocumentSectionMetadataRepository documentSectionMetadataRepository;


    @Autowired
    public DocumentService(DocumentInstanceRepository documentInstanceRepository,
                           DocumentInstanceSectionRepository documentInstanceSectionRepository,
                           DocumentSectionMetadataRepository documentSectionMetadataRepository) {
        this.documentInstanceRepository = documentInstanceRepository;
        this.documentInstanceSectionRepository = documentInstanceSectionRepository;
        this.documentSectionMetadataRepository = documentSectionMetadataRepository;
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


        if (documentInstance.getId() != null) {
            throw new GendoxException("NEW_DOCUMENT_ID_IS_NOT_NULL", "Document id must be null", HttpStatus.BAD_REQUEST);
        }

        documentInstance.setCreatedAt(now);
        documentInstance.setUpdatedAt(now);

        // Save the DocumentInstance first to generate its ID
        documentInstance = documentInstanceRepository.save(documentInstance);

        List<DocumentInstanceSection> documentInstanceSections = new ArrayList<>();


        // Iterate through the list and save each item individually
        for (DocumentInstanceSection section : documentInstance.getDocumentInstanceSections()) {
            // Set the document_instance_id for each section to the ID of the parent documentInstance
            section.setDocumentInstance(documentInstance);
            section.setCreatedAt(now);
            section.setUpdatedAt(now);

//            DocumentSectionMetadata metadata = section.getDocumentSectionMetadata();
//            metadata.setCreatedAt(now);
//            metadata.setUpdatedAt(now);
            DocumentSectionMetadata metadata = section.getDocumentSectionMetadata();


            if (metadata.getDocumentSectionTypeId() == null || metadata.getSectionOrder() == null) {

                metadata.setDocumentSectionTypeId(12L);
                metadata.setSectionOrder(0);
                metadata.setCreatedAt(now);
                metadata.setUpdatedAt(now);

            } else {

                metadata.setCreatedAt(now);
                metadata.setUpdatedAt(now);
            }
            metadata = documentSectionMetadataRepository.save(metadata);
            section.setDocumentSectionMetadata(metadata);

            DocumentInstanceSection savedSection = documentInstanceSectionRepository.save(section);
            documentInstanceSections.add(savedSection);
        }

        // Set the saved sections back to the document instance
        documentInstance.setDocumentInstanceSections(documentInstanceSections);


        return documentInstance;


    }


}
