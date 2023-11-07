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
    private DocumentInstanceSectionRepository documentInstanceSectionRepository;
    private DocumentSectionMetadataRepository documentSectionMetadataRepository;
    private SecurityUtils securityUtils;
    private TrainingService trainingService;



    @Autowired
    private JWTUtils jwtUtils;

    @Autowired
    public DocumentService(DocumentInstanceRepository documentInstanceRepository,
                           DocumentInstanceSectionRepository documentInstanceSectionRepository,
                           DocumentSectionMetadataRepository documentSectionMetadataRepository,
                           SecurityUtils securityUtils,
                           TrainingService trainingService) {
        this.documentInstanceRepository = documentInstanceRepository;
        this.documentInstanceSectionRepository = documentInstanceSectionRepository;
        this.documentSectionMetadataRepository = documentSectionMetadataRepository;
        this.securityUtils = securityUtils;
        this.trainingService = trainingService;
    }


    public DocumentInstance getDocumentInstanceById(UUID id) throws GendoxException {
        return documentInstanceRepository.findById(id)
                .orElseThrow(() -> new GendoxException("DOCUMENT_NOT_FOUND", "Document not found with id: " + id, HttpStatus.NOT_FOUND));

    }

    public DocumentSectionMetadata getMetadataById(UUID id) throws GendoxException {
        return documentSectionMetadataRepository.findById(id)
                .orElseThrow(() -> new GendoxException("METADATA_NOT_FOUND", "Metadata not found with id: " + id, HttpStatus.NOT_FOUND));

    }

    public DocumentInstanceSection getSectionById(UUID id) throws GendoxException {
        return documentInstanceSectionRepository.findById(id)
                .orElseThrow(() -> new GendoxException("SECTION_NOT_FOUND", "Section not found with id: " + id, HttpStatus.NOT_FOUND));

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


    public List<DocumentInstanceSection> getProjectSections(UUID projectId) throws GendoxException {
        return documentInstanceSectionRepository.findByProjectId(projectId);
    }

    /**
     * TODO merge this with the above to findSectionsByCriteria
     *
     * @param projectId
     * @param embeddingIds
     * @return
     */
    public List<DocumentInstanceSection> getSectionsByEmbeddingsIn(UUID projectId, Set<UUID> embeddingIds) {
        return documentInstanceSectionRepository.findByProjectAndEmbeddingIds(projectId, embeddingIds);
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
        documentInstanceRepository.save(documentInstance);

        // Set the saved sections back to the document instance
        if (documentInstance.getDocumentInstanceSections() != null) {
            documentInstance.setDocumentInstanceSections(createSections(documentInstance));
        }

        return documentInstance;
    }


    public List<DocumentInstanceSection> createSections(DocumentInstance documentInstance) throws GendoxException {
        List<DocumentInstanceSection> documentInstanceSections = new ArrayList<>();

        for (DocumentInstanceSection section : documentInstance.getDocumentInstanceSections()) {
            section.setDocumentInstance(documentInstance);
            DocumentInstanceSection savedSection = createSection(section);
            documentInstanceSections.add(savedSection);
        }
        return documentInstanceSections;
    }


    public DocumentInstanceSection createSection(DocumentInstanceSection section) throws GendoxException {

        section.setCreatedAt(Instant.now());
        section.setUpdatedAt(Instant.now());
        section.setCreatedBy(securityUtils.getUserId());
        section.setUpdatedBy(securityUtils.getUserId());
        // take moderation check
        Gpt35ModerationResponse gpt35ModerationResponse = trainingService.getModeration(section.getSectionValue());
        section.setModerationFlagged(gpt35ModerationResponse.getResults().get(0).isFlagged());
        //create metadata
        section.setDocumentSectionMetadata(createMetadata(section));
        section = documentInstanceSectionRepository.save(section);

        return section;
    }


    public DocumentSectionMetadata createMetadata(DocumentInstanceSection section) throws GendoxException {
        DocumentSectionMetadata metadata = section.getDocumentSectionMetadata();


        if (metadata.getDocumentSectionTypeId() == null || metadata.getSectionOrder() == null) {
            throw new GendoxException("SECTION_TYPE_ID_AND_SECTION_ORDER_MUST_NOT_NULL", " SectionTypeId and SectionOrder must not be null", HttpStatus.BAD_REQUEST);
        }

        metadata.setCreatedAt(Instant.now());
        metadata.setUpdatedAt(Instant.now());
        metadata.setCreatedBy(securityUtils.getUserId());
        metadata.setUpdatedBy(securityUtils.getUserId());
        metadata = documentSectionMetadataRepository.save(metadata);

        return metadata;
    }


    public DocumentInstance updateDocument(DocumentInstance documentInstance) throws GendoxException {
        UUID documentId = documentInstance.getId();
        DocumentInstance existingDocument = this.getDocumentInstanceById(documentId);

        // Update the properties of the existingDocument with the values from the updated document
        existingDocument.setDocumentTemplateId(documentInstance.getDocumentTemplateId());
        existingDocument.setRemoteUrl(documentInstance.getRemoteUrl());
        existingDocument.setDocumentInstanceSections(updateSections(documentInstance));
        existingDocument.setUpdatedBy(securityUtils.getUserId());
        existingDocument.setUpdatedAt(Instant.now());

        existingDocument = documentInstanceRepository.save(existingDocument);

        return existingDocument;
    }

    public List<DocumentInstanceSection> updateSections(DocumentInstance instance) throws GendoxException {
        List<DocumentInstanceSection> documentInstanceSections = new ArrayList<>();

        for (DocumentInstanceSection section : instance.getDocumentInstanceSections()) {
            section.setDocumentInstance(instance);
            DocumentInstanceSection savedSection = updateSection(section);
            documentInstanceSections.add(savedSection);
        }

        return documentInstanceSections;
    }


    public DocumentInstanceSection updateSection(DocumentInstanceSection section) throws GendoxException {
        UUID sectionId = section.getId();
        DocumentInstanceSection existingSection = this.getSectionById(sectionId);

        existingSection.setSectionValue(section.getSectionValue());
        existingSection.setUpdatedBy(securityUtils.getUserId());
        existingSection.setUpdatedAt(Instant.now());

        // Check if documentInstance.documentTemplateId is empty/null before updating metadata
        if (section.getDocumentInstance().getDocumentTemplateId() == null) {
            existingSection.setDocumentSectionMetadata(updateMetadata(section));
        }

        existingSection = documentInstanceSectionRepository.save(existingSection);

        return existingSection;
    }


    public DocumentSectionMetadata updateMetadata(DocumentInstanceSection section) throws GendoxException {
        UUID metadataId = section.getDocumentSectionMetadata().getId();
        DocumentSectionMetadata metadata = section.getDocumentSectionMetadata();
        DocumentSectionMetadata existingMetadata = this.getMetadataById(metadataId);

        existingMetadata.setDocumentTemplateId(metadata.getDocumentTemplateId());
        existingMetadata.setDocumentSectionTypeId(metadata.getDocumentSectionTypeId());
        existingMetadata.setTitle(metadata.getTitle());
        existingMetadata.setDescription(metadata.getDescription());
        existingMetadata.setSectionOptions(metadata.getSectionOptions());
        existingMetadata.setSectionOrder(metadata.getSectionOrder());
        existingMetadata.setUpdatedBy(securityUtils.getUserId());
        existingMetadata.setUpdatedAt(Instant.now());

        existingMetadata = documentSectionMetadataRepository.save(existingMetadata);

        return existingMetadata;
    }


    public void deleteDocument(UUID id) throws GendoxException {
        DocumentInstance documentInstance = this.getDocumentInstanceById(id);
        deleteSections(documentInstance.getDocumentInstanceSections());
        documentInstanceRepository.delete(documentInstance);
    }


    public void deleteSections(List<DocumentInstanceSection> sections) throws GendoxException {
        for (DocumentInstanceSection section : sections) {
            DocumentSectionMetadata metadata = section.getDocumentSectionMetadata();
            documentInstanceSectionRepository.delete(section);
            deleteMetadata(metadata);
        }
    }


    public void deleteMetadata(DocumentSectionMetadata metadata) throws GendoxException {
        documentSectionMetadataRepository.delete(metadata);
    }


}
