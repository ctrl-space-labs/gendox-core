package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionOrderDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentInstanceSectionCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceSectionRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentSectionMetadataRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.DocumentInstanceSectionPredicates;
import dev.ctrlspace.gendox.provenAi.utils.MockUniqueIdentifierServiceAdapter;
import dev.ctrlspace.gendox.provenAi.utils.UniqueIdentifierCodeResponse;
import dev.ctrlspace.provenai.iscc.IsccCodeResponse;
import dev.ctrlspace.provenai.iscc.IsccCodeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@Service
public class DocumentSectionService {

    Logger logger = LoggerFactory.getLogger(DocumentSectionService.class);

    private TypeService typeService;
    private TrainingService trainingService;
    private DocumentInstanceSectionRepository documentInstanceSectionRepository;
    private DocumentSectionMetadataRepository documentSectionMetadataRepository;
    private EmbeddingService embeddingService;
    private MockUniqueIdentifierServiceAdapter mockUniqueIdentifierServiceAdapter;
    private MessageService messageService;

    private IsccCodeService isccCodeService;

    @Value("${proven-ai.sdk.iscc.enabled}")
    private Boolean isccEnabled;


    @Lazy
    @Autowired
    public void setEmbeddingService(EmbeddingService embeddingService) {
        this.embeddingService = embeddingService;
    }

    @Autowired
    public DocumentSectionService(TypeService typeService,
                                  TrainingService trainingService,
                                  DocumentInstanceSectionRepository documentInstanceSectionRepository,
                                  DocumentSectionMetadataRepository documentSectionMetadataRepository,
                                  MockUniqueIdentifierServiceAdapter mockUniqueIdentifierServiceAdapter,
                                  MessageService messageService,
                                  IsccCodeService isccCodeService
    ) {
        this.typeService = typeService;
        this.trainingService = trainingService;
        this.documentInstanceSectionRepository = documentInstanceSectionRepository;
        this.documentSectionMetadataRepository = documentSectionMetadataRepository;
        this.mockUniqueIdentifierServiceAdapter = mockUniqueIdentifierServiceAdapter;
        this.messageService = messageService;
        this.isccCodeService = isccCodeService;
    }


    public DocumentSectionMetadata getMetadataById(UUID id) throws GendoxException {
        return documentSectionMetadataRepository.findById(id)
                .orElseThrow(() -> new GendoxException("METADATA_NOT_FOUND", "Metadata not found with id: " + id, HttpStatus.NOT_FOUND));

    }

    public DocumentSectionMetadata getMetadataBySectionId(UUID sectionId) throws GendoxException {
        DocumentInstanceSection section = getSectionById(sectionId);
        return section.getDocumentSectionMetadata();
    }


    public DocumentInstanceSection getSectionById(UUID id) throws GendoxException {
        return documentInstanceSectionRepository.findById(id)
                .orElseThrow(() -> new GendoxException("SECTION_NOT_FOUND", "Section not found with id: " + id, HttpStatus.NOT_FOUND));

    }


    public Page<DocumentInstanceSection> getAllSections(DocumentInstanceSectionCriteria criteria, Pageable pageable) throws GendoxException {
        return documentInstanceSectionRepository.findAll(DocumentInstanceSectionPredicates.build(criteria), pageable);
    }

//    public String getFileNameFromUrl(String url) {
//        String normalizedUrl = url.startsWith("file:") ? url.substring(5) : url;
//        normalizedUrl = url.startsWith("s3:") ? url.substring(3) : url;
//        // Replace backslashes with forward slashes
//        normalizedUrl = normalizedUrl.replace('\\', '/');
//
//        Path path = Paths.get(normalizedUrl);
//        return path.getFileName().toString();
//    }

    public String getFileNameFromUrl(String url) {
        String normalizedUrl;

        if (url.startsWith("file:")) {
            normalizedUrl = url.substring(5); // Remove "file:" prefix
        } else if (url.startsWith("s3:")) {
            normalizedUrl = url.substring(3); // Remove "s3:" prefix
        } else if (url.startsWith("http:") || url.startsWith("https:")) {
            try {
                // Parse the URL and get the path
                URI uri = new URI(url);
                normalizedUrl = uri.getPath(); // Extract the path component
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid HTTP/HTTPS URL format: " + url, e);
            }
        } else {
            throw new IllegalArgumentException("Unsupported URL format: " + url);
        }
        // Replace backslashes with forward slashes
        normalizedUrl = normalizedUrl.replace('\\', '/');

        Path path = Paths.get(normalizedUrl);
        return path.getFileName().toString();
    }

    /**
     * TODO merge this with the above to findSectionsByCriteria
     *
     * @param projectId
     * @param sectionIds
     * @return
     */
    public List<DocumentInstanceSection> getSectionsBySectionsIn(UUID projectId, Set<UUID> sectionIds) {
        return documentInstanceSectionRepository.findByProjectAndSectionIds(projectId, sectionIds);
    }


    public List<DocumentInstanceSection> getProjectSections(UUID projectId) throws GendoxException {
        return documentInstanceSectionRepository.findByProjectId(projectId);
    }

    public List<DocumentInstanceSection> getSectionsByDocument(UUID documentInstanceId) throws GendoxException {
        return documentInstanceSectionRepository.findByDocumentInstance(documentInstanceId);
    }

    public List<DocumentInstanceSection> createSections(DocumentInstance documentInstance, List<String> contentSections) throws GendoxException {
        // if the document instance already has sections in the database, delete it
        this.deleteDocumentSections(documentInstance.getId());
        List<DocumentInstanceSection> sections = new ArrayList<>();
        Integer sectionOrder = 0;
        for (String contentSection : contentSections) {
            sectionOrder++;
            DocumentInstanceSection section = createSection(documentInstance, contentSection, sectionOrder);
            sections.add(section);
        }

        sections = documentInstanceSectionRepository.saveAll(sections);

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


        String documentSectionIsccCode = generateDocumentSectionIsccCode(section);


        section.setDocumentSectionIsccCode(documentSectionIsccCode);

        // take moderation check
//        OpenAiGpt35ModerationResponse openAiGpt35ModerationResponse = trainingService.getModeration(section.getSectionValue());
//        section.setHasContentWarning(openAiGpt35ModerationResponse.getResults().get(0).isFlagged());

        //create metadata
        section.setDocumentSectionMetadata(createMetadata(section));
//        // sava section
//        section = documentInstanceSectionRepository.save(section);


        return section;
    }

    public DocumentInstanceSection createNewSection(DocumentInstance documentInstance, String fileContent, String sectionTitle) throws GendoxException {
        Integer sectionOrder = 2;
        DocumentInstanceSection section = new DocumentInstanceSection();
        // create section's metadata
        DocumentSectionMetadata metadata = new DocumentSectionMetadata();
        metadata.setDocumentSectionTypeId(typeService.getDocumentTypeByName("FIELD_TEXT").getId());
        metadata.setTitle(sectionTitle);
        metadata.setSectionOrder(sectionOrder);

        section.setDocumentSectionMetadata(metadata);
        section.setSectionValue(fileContent);
        section.setDocumentInstance(documentInstance);

        String fileName = getFileNameFromUrl(section.getDocumentInstance().getRemoteUrl());


        String documentSectionIsccCode = generateDocumentSectionIsccCode(section);

        section.setDocumentSectionIsccCode(documentSectionIsccCode);


        // take moderation check
//        OpenAiGpt35ModerationResponse openAiGpt35ModerationResponse = trainingService.getModeration(section.getSectionValue());
//        section.setHasContentWarning(openAiGpt35ModerationResponse.getResults().get(0).isFlagged());

        //create metadata
        section.setDocumentSectionMetadata(createMetadata(section));
        // sava section
        section = documentInstanceSectionRepository.save(section);


        return section;
    }


    public DocumentInstanceSection createNewSection(DocumentInstance documentInstance) throws GendoxException {
        DocumentInstanceSection newSection = new DocumentInstanceSection();
        DocumentSectionMetadata metadata = new DocumentSectionMetadata();
        metadata.setDocumentSectionTypeId(typeService.getDocumentTypeByName("FIELD_TEXT").getId());
        metadata.setTitle("Default Title");
        metadata.setSectionOrder(documentInstance.getDocumentInstanceSections().size() + 1);
        metadata = documentSectionMetadataRepository.save(metadata);
        newSection.setDocumentInstance(documentInstance);
        newSection.setDocumentSectionMetadata(metadata);
        newSection.setHasContentWarning(false);
        newSection = documentInstanceSectionRepository.save(newSection);
        return newSection;
    }

    public String generateDocumentSectionIsccCode(DocumentInstanceSection newSection) throws GendoxException {
        String documentSectionIsccCode;
        String fileName = getFileNameFromUrl(newSection.getDocumentInstance().getRemoteUrl());


        if (isccEnabled) {
            IsccCodeResponse sectionIsccCodeResponse = isccCodeService.getDocumentUniqueIdentifier(
                    newSection.getSectionValue().getBytes(), fileName);
            documentSectionIsccCode = sectionIsccCodeResponse.getIscc();
        } else {
            UniqueIdentifierCodeResponse sectionUniqueIdentifierCodeResponse = mockUniqueIdentifierServiceAdapter.getDocumentUniqueIdentifier(
                    newSection.getSectionValue().getBytes(), fileName);
            documentSectionIsccCode = sectionUniqueIdentifierCodeResponse.getUuid();
        }

        return documentSectionIsccCode;
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
            DocumentInstanceSection savedSection = updateExistingSection(section);
            documentInstanceSections.add(savedSection);
        }

        documentInstanceSections = documentInstanceSectionRepository.saveAll(documentInstanceSections);

        return documentInstanceSections;
    }

    public DocumentInstanceSection updateExistingSection(DocumentInstanceSection section) throws GendoxException {
        UUID sectionId = section.getId();
        DocumentInstanceSection existingSection = this.getSectionById(sectionId);
        existingSection.setSectionValue(section.getSectionValue());
        String fileName = getFileNameFromUrl(existingSection.getDocumentInstance().getRemoteUrl());
//        UniqueIdentifierCodeResponse sectionUniqueIdentifierCodeResponse = mockUniqueIdentifierServiceAdapter.getDocumentUniqueIdentifier(
//                existingSection.getSectionValue().getBytes(), fileName);
        IsccCodeResponse sectionUniqueIdentifierCodeResponse = isccCodeService.getDocumentUniqueIdentifier(
                existingSection.getSectionValue().getBytes(), fileName);
//        existingSection.setDocumentSectionIsccCode(sectionUniqueIdentifierCodeResponse.getUuid());
        existingSection.setDocumentSectionIsccCode(sectionUniqueIdentifierCodeResponse.getIscc());

        existingSection.setDocumentSectionMetadata(updateMetadata(section));

        return existingSection;
    }


    public DocumentInstanceSection updateSection(DocumentInstanceSection section) throws GendoxException {

        UUID sectionId = section.getId();
        DocumentInstanceSection existingSection = this.getSectionById(sectionId);

        existingSection.setSectionValue(section.getSectionValue());
        String fileName = getFileNameFromUrl(existingSection.getDocumentInstance().getRemoteUrl());
//      ISCC code
//        UniqueIdentifierCodeResponse sectionUniqueIdentifierCodeResponse = isccCodeServiceAdapter.getDocumentUniqueIdentifier(
//                                                                existingSection.getSectionValue().getBytes(), fileName);
//      Mock Unique Identifier Code: UUID
        UniqueIdentifierCodeResponse sectionUniqueIdentifierCodeResponse = mockUniqueIdentifierServiceAdapter.getDocumentUniqueIdentifier(
                existingSection.getSectionValue().getBytes(), fileName);

//        existingSection.setDocumentSectionIsccCode(sectionUniqueIdentifierCodeResponse.getIscc());
        existingSection.setDocumentSectionIsccCode(sectionUniqueIdentifierCodeResponse.getUuid());

        // Check if documentInstance.documentTemplateId is empty/null before updating metadata
//        if (section.getDocumentInstance().getDocumentTemplateId() == null) {
        existingSection.setDocumentSectionMetadata(updateMetadata(section));
//        }

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

    public void updateSectionsOrder(List<DocumentInstanceSectionOrderDTO> sectionOrderDTOs) throws GendoxException {

        for (DocumentInstanceSectionOrderDTO sectionOrderDTO : sectionOrderDTOs) {
            DocumentSectionMetadata metadata = this.getMetadataById(sectionOrderDTO.getDocumentSectionMetadataId());
            metadata.setSectionOrder(sectionOrderDTO.getSectionOrder());
            documentSectionMetadataRepository.save(metadata);
        }


    }

    public void deleteSections(List<DocumentInstanceSection> sections) throws GendoxException {
        for (DocumentInstanceSection section : sections) {
            deleteSection(section);
        }
    }

    public void deleteSection(DocumentInstanceSection section) throws GendoxException {
        messageService.deleteMessageSection(section.getId());
        DocumentSectionMetadata metadata = section.getDocumentSectionMetadata();
        embeddingService.deleteEmbeddingGroupsBySection(section.getId());
        documentInstanceSectionRepository.delete(section);
        deleteMetadata(metadata);
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
