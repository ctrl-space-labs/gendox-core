package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiGpt35ModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentSectionMetadata;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentInstanceSectionCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceSectionRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentSectionMetadataRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectAgentRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.DocumentInstanceSectionPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.ServiceSelector;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.documents.DocumentSplitter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class DocumentSectionService {


    private TypeService typeService;
    private ServiceSelector serviceSelector;
    private ProjectAgentRepository projectAgentRepository;
    private TrainingService trainingService;
    private DocumentInstanceSectionRepository documentInstanceSectionRepository;
    private DocumentSectionMetadataRepository documentSectionMetadataRepository;
    private SecurityUtils securityUtils;



    @Autowired
    public DocumentSectionService(TypeService typeService,
                            ServiceSelector serviceSelector,
                            ProjectAgentRepository projectAgentRepository,
                            TrainingService trainingService,
                            DocumentInstanceSectionRepository documentInstanceSectionRepository,
                            DocumentSectionMetadataRepository documentSectionMetadataRepository,
                            SecurityUtils securityUtils) {
        this.typeService = typeService;
        this.serviceSelector = serviceSelector;
        this.projectAgentRepository = projectAgentRepository;
        this.trainingService = trainingService;
        this.documentInstanceSectionRepository = documentInstanceSectionRepository;
        this.documentSectionMetadataRepository = documentSectionMetadataRepository;
        this.securityUtils = securityUtils;
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
        return documentInstanceSectionRepository.findAll(DocumentInstanceSectionPredicates.build(criteria),  pageable);
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

    public List<DocumentInstanceSection> getSectionsByDocument(UUID documentInstanceId) throws GendoxException{
        return documentInstanceSectionRepository.findByDocumentInstance(documentInstanceId);
    }



    public List<DocumentInstanceSection> createSections(DocumentInstance documentInstance, String fileContent, UUID agentId) throws GendoxException {
        List<DocumentInstanceSection> sections = new ArrayList<>();
        // take the splitters type from Agent
        ProjectAgent agent = projectAgentRepository.findById(agentId)
                .orElseThrow(() -> new GendoxException("PROJECT_AGENT_NOT_FOUND", "Project's Agent not found with id: " + agentId, HttpStatus.NOT_FOUND));
        String splitterTypeName = agent.getDocumentSplitterType().getName();

        DocumentSplitter documentSplitter = serviceSelector.getDocumentSplitterByName(splitterTypeName);
        if (documentSplitter == null) {
            throw new GendoxException("DOCUMENT_SPLITTER_NOT_FOUND", "Document splitter not found with name: " + splitterTypeName, HttpStatus.NOT_FOUND);
        }

        List<String> contentSections = documentSplitter.split(fileContent);

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
        section.setCreatedAt(Instant.now());
        section.setUpdatedAt(Instant.now());
        section.setCreatedBy(securityUtils.getUserId());
        section.setUpdatedBy(securityUtils.getUserId());

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

        metadata.setCreatedAt(Instant.now());
        metadata.setUpdatedAt(Instant.now());
        metadata.setCreatedBy(securityUtils.getUserId());
        metadata.setUpdatedBy(securityUtils.getUserId());
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

    public void deleteSections(List<DocumentInstanceSection> sections) throws GendoxException {
        for (DocumentInstanceSection section : sections) {
            DocumentSectionMetadata metadata = section.getDocumentSectionMetadata();
            documentInstanceSectionRepository.delete(section);
            deleteMetadata(metadata);
        }
    }

    public void deleteDocumentSections(UUID documentInstanceId) throws GendoxException{
        List<DocumentInstanceSection> sections =
                documentInstanceSectionRepository.findByDocumentInstance(documentInstanceId);
        deleteSections(sections);
    }

    public void deleteMetadata(DocumentSectionMetadata metadata) throws GendoxException {
        documentSectionMetadataRepository.delete(metadata);
    }
}
