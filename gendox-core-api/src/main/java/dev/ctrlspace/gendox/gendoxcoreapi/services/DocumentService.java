package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceRepository;
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


    @Autowired
    public DocumentService(DocumentInstanceRepository documentInstanceRepository) {
        this.documentInstanceRepository = documentInstanceRepository;
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

    public DocumentInstance createDocumentInstance(DocumentInstance documentInstance) throws GendoxException{
        Instant now = Instant.now();

        if (documentInstance.getId() != null) {
            throw new GendoxException("NEW_DOCUMENT_ID_IS_NOT_NULL", "Document id must be null", HttpStatus.BAD_REQUEST);
        }

        documentInstance.setCreatedAt(now);
        documentInstance.setUpdatedAt(now);

        documentInstance = documentInstanceRepository.save(documentInstance);

        return documentInstance;


    }


}
