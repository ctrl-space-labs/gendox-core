package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiGpt35ModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentInstanceSectionCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceSectionRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentSectionMetadataRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectAgentRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.DocumentInstanceSectionPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.ServiceSelector;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.documents.DocumentSplitter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class DocumentSectionService {


    private TypeService typeService;
    private ProjectAgentRepository projectAgentRepository;
    private TrainingService trainingService;
    private DocumentInstanceSectionRepository documentInstanceSectionRepository;
    private DocumentSectionMetadataRepository documentSectionMetadataRepository;
    private EmbeddingService embeddingService;
    private SecurityUtils securityUtils;



    @Lazy
    @Autowired
    public void setEmbeddingService(EmbeddingService embeddingService) {
        this.embeddingService = embeddingService;
    }

    @Autowired
    public DocumentSectionService(TypeService typeService,
                                  ProjectAgentRepository projectAgentRepository,
                                  TrainingService trainingService,
                                  DocumentInstanceSectionRepository documentInstanceSectionRepository,
                                  DocumentSectionMetadataRepository documentSectionMetadataRepository,
                                  SecurityUtils securityUtils) {
        this.typeService = typeService;
        this.projectAgentRepository = projectAgentRepository;
        this.trainingService = trainingService;
        this.documentInstanceSectionRepository = documentInstanceSectionRepository;
        this.documentSectionMetadataRepository = documentSectionMetadataRepository;
    }


    public DocumentSectionMetadata getMetadataById(UUID id) throws GendoxException {
        return documentSectionMetadataRepository.findById(id)
                .orElseThrow(() -> new GendoxException("METADATA_NOT_FOUND", "Metadata not found with id: " + id, HttpStatus.NOT_FOUND));

    }

    public DocumentInstanceSection getSectionById(UUID id) throws GendoxException {
        return documentInstanceSectionRepository.findById(id)
                .orElseThrow(() -> new GendoxException("SECTION_NOT_FOUND", "Section not found with id: " + id, HttpStatus.NOT_FOUND));

    }


    public Page<DocumentInstanceSection> getAllSections(DocumentInstanceSectionCriteria criteria, Pageable pageable) throws GendoxException {
        return documentInstanceSectionRepository.findAll(DocumentInstanceSectionPredicates.build(criteria), pageable);
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


    public List<DocumentInstanceSection> getProjectSections(UUID projectId) throws GendoxException {
        return documentInstanceSectionRepository.findByProjectId(projectId);
    }

    public List<DocumentInstanceSection> getSectionsByDocument(UUID documentInstanceId) throws GendoxException {
        return documentInstanceSectionRepository.findByDocumentInstance(documentInstanceId);
    }

    public List<DocumentInstanceSection> createSections(DocumentInstance documentInstance, List<String> contentSections) throws GendoxException{
        // if the document instance already has sections in the database, delete it
        this.deleteDocumentSections(documentInstance.getId());
        List<DocumentInstanceSection> sections = new ArrayList<>();
        Integer sectionOrder = 0;
        for (String contentSection : contentSections) {
            sectionOrder++;
            DocumentInstanceSection section = createSection(documentInstance, contentSection, sectionOrder);
            sections.add(section);
        }

        return sections;
    }

    public DocumentInstanceSection createSection(DocumentInstance documentInstance, String fileContent, Integer sectionOrder) throws GendoxException {
        DocumentInstanceSection section = new DocumentInstanceSection();
        // create section's metadata
        DocumentSectionMetadata metadata = new DocumentSectionMetadata();
        metadata.setDocumentSectionTypeId(typeService.getDocumentTypeByName("FIELD_TEXT").getId());
        metadata.setTitle("Default Title");
        metadata.setSectionOrder(sectionOrder);

        section.setDocumentSectionMetadata(metadata);
        section.setSectionValue(fileContent);
        section.setDocumentInstance(documentInstance);

        // take moderation check
        OpenAiGpt35ModerationResponse openAiGpt35ModerationResponse = trainingService.getModeration(section.getSectionValue());
        section.setModerationFlagged(openAiGpt35ModerationResponse.getResults().get(0).isFlagged());

        //create metadata
        section.setDocumentSectionMetadata(createMetadata(section));
        // sava section
        section = documentInstanceSectionRepository.save(section);


        return section;
    }

    public DocumentSectionMetadata createMetadata(DocumentInstanceSection section) throws GendoxException {
        DocumentSectionMetadata metadata = section.getDocumentSectionMetadata();


        if (metadata.getDocumentSectionTypeId() == null || metadata.getSectionOrder() == null) {
            throw new GendoxException("SECTION_TYPE_ID_AND_SECTION_ORDER_MUST_NOT_NULL", " SectionTypeId and SectionOrder must not be null", HttpStatus.BAD_REQUEST);
        }

        metadata = documentSectionMetadataRepository.save(metadata);

        return metadata;
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


        existingMetadata = documentSectionMetadataRepository.save(existingMetadata);

        return existingMetadata;
    }

    public void deleteSections(List<DocumentInstanceSection> sections) throws GendoxException {
        for (DocumentInstanceSection section : sections) {
            DocumentSectionMetadata metadata = section.getDocumentSectionMetadata();
            embeddingService.deleteEmbeddingGroupsBySection(section.getId());
            documentInstanceSectionRepository.delete(section);
            deleteMetadata(metadata);
        }
    }

    public void deleteDocumentSections(UUID documentInstanceId) throws GendoxException {
        List<DocumentInstanceSection> sections =
                documentInstanceSectionRepository.findByDocumentInstance(documentInstanceId);
        deleteSections(sections);
    }

    public void deleteMetadata(DocumentSectionMetadata metadata) throws GendoxException {
        documentSectionMetadataRepository.delete(metadata);
    }
}
