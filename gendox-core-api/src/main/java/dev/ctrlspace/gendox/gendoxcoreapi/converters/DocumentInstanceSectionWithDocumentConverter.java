package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentSectionMetadata;
import dev.ctrlspace.gendox.gendoxcoreapi.model.EmbeddingGroup;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentSectionMetadataDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.EmbeddingGroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class DocumentInstanceSectionWithDocumentConverter implements GendoxConverter<DocumentInstanceSection, DocumentInstanceSectionDTO> {

    private DocumentSectionMetadataConverter documentSectionMetadataConverter;
    private DocumentOnlyConverter documentOnlyConverter;

    private EmbeddingGroupRepository embeddingGroupRepository;

    private AiModelRepository aiModelRepository;


    @Autowired
    public DocumentInstanceSectionWithDocumentConverter(DocumentSectionMetadataConverter documentSectionMetadataConverter,
                                                        DocumentOnlyConverter documentOnlyConverter,
                                                        EmbeddingGroupRepository embeddingGroupRepository,
                                                        AiModelRepository aiModelRepository) {
        this.documentSectionMetadataConverter = documentSectionMetadataConverter;
        this.documentOnlyConverter = documentOnlyConverter;
        this.embeddingGroupRepository = embeddingGroupRepository;
        this.aiModelRepository = aiModelRepository;

    }

    @Override
    public DocumentInstanceSectionDTO toDTO(DocumentInstanceSection documentInstanceSection) {
        Optional<EmbeddingGroup> embeddingGroupOptional = embeddingGroupRepository.findBySectionIdOrMessageId(documentInstanceSection.getId(), null);
        String aiModelName = aiModelRepository.findNameById(embeddingGroupOptional.get().getSemanticSearchModelId());

        return toDTO(documentInstanceSection, embeddingGroupOptional.get(), aiModelName);
    }

    /**
     * Converts the sections of a search result. Their embedding groups come from one query and each model name is
     * read once, where {@link #toDTO(DocumentInstanceSection)} runs two queries for every section.
     */
    public List<DocumentInstanceSectionDTO> toDTOs(List<DocumentInstanceSection> documentInstanceSections) {
        if (documentInstanceSections.isEmpty()) {
            return new ArrayList<>();
        }
        List<UUID> sectionIds = documentInstanceSections.stream().map(DocumentInstanceSection::getId).toList();
        Map<UUID, EmbeddingGroup> embeddingGroupBySectionId = embeddingGroupRepository.findAllBySectionIdIn(sectionIds).stream()
                .collect(Collectors.toMap(EmbeddingGroup::getSectionId, Function.identity()));
        Map<UUID, String> aiModelNameById = new HashMap<>();

        List<DocumentInstanceSectionDTO> documentInstanceSectionDTOs = new ArrayList<>();
        for (DocumentInstanceSection documentInstanceSection : documentInstanceSections) {
            EmbeddingGroup embeddingGroup = Optional.ofNullable(embeddingGroupBySectionId.get(documentInstanceSection.getId())).get();
            String aiModelName = aiModelNameById.computeIfAbsent(embeddingGroup.getSemanticSearchModelId(), aiModelRepository::findNameById);
            documentInstanceSectionDTOs.add(toDTO(documentInstanceSection, embeddingGroup, aiModelName));
        }
        return documentInstanceSectionDTOs;
    }

    private DocumentInstanceSectionDTO toDTO(DocumentInstanceSection documentInstanceSection, EmbeddingGroup embeddingGroup, String aiModelName) {
        DocumentInstanceSectionDTO documentInstanceSectionDTO = new DocumentInstanceSectionDTO();

        documentInstanceSectionDTO.setId(documentInstanceSection.getId());
        documentInstanceSectionDTO.setSectionValue(documentInstanceSection.getSectionValue());
        documentInstanceSectionDTO.setDocumentSectionIsccCode(documentInstanceSection.getDocumentSectionIsccCode());
        documentInstanceSectionDTO.setTokenCount(embeddingGroup.getTokenCount());
        documentInstanceSectionDTO.setAiModelName(aiModelName);
        documentInstanceSectionDTO.setCreatedBy(documentInstanceSection.getCreatedBy());
        documentInstanceSectionDTO.setUpdatedBy(documentInstanceSection.getUpdatedBy());
        documentInstanceSectionDTO.setCreatedAt(documentInstanceSection.getCreatedAt());
        documentInstanceSectionDTO.setUpdatedAt(documentInstanceSection.getUpdatedAt());

        DocumentSectionMetadataDTO metadataDTO = documentSectionMetadataConverter.toDTO(documentInstanceSection.getDocumentSectionMetadata());
        documentInstanceSectionDTO.setDocumentSectionMetadata(metadataDTO);

        if (documentInstanceSection.getDocumentInstance() != null) {

            DocumentInstanceDTO documentInstanceDTO = documentOnlyConverter.toDTO(documentInstanceSection.getDocumentInstance());
            documentInstanceSectionDTO.setDocumentInstanceDTO(documentInstanceDTO);
            documentInstanceSectionDTO.setDocumentURL(documentInstanceDTO.getExternalUrl());

        }
        // This is not used in general, but can be set if needed
        // ProvenAI populates this to indicate the owner from another (external) project
//        documentInstanceSectionDTO.setOwnerName(documentInstanceSection.getCreatedBy().to);


        return documentInstanceSectionDTO;
    }

//    @Override
//    public DocumentInstanceSection toEntity(DocumentInstanceSectionDTO documentInstanceSectionDTO) {
//        throw new UnsupportedOperationException("Not implemented yet!");
//    }

    @Override
    public DocumentInstanceSection toEntity(DocumentInstanceSectionDTO documentInstanceSectionDTO) {
        DocumentInstanceSection documentInstanceSection = new DocumentInstanceSection();

        // Map fields from DTO to entity
        documentInstanceSection.setId(documentInstanceSectionDTO.getId());
        documentInstanceSection.setSectionValue(documentInstanceSectionDTO.getSectionValue());
        documentInstanceSection.setDocumentSectionIsccCode(documentInstanceSectionDTO.getDocumentSectionIsccCode());
        documentInstanceSection.setCreatedBy(documentInstanceSectionDTO.getCreatedBy());
        documentInstanceSection.setUpdatedBy(documentInstanceSectionDTO.getUpdatedBy());
        documentInstanceSection.setCreatedAt(documentInstanceSectionDTO.getCreatedAt());
        documentInstanceSection.setUpdatedAt(documentInstanceSectionDTO.getUpdatedAt());

        // Map DocumentSectionMetadataDTO to DocumentSectionMetadata
        DocumentSectionMetadata metadata = documentSectionMetadataConverter.toEntity(documentInstanceSectionDTO.getDocumentSectionMetadata());
        documentInstanceSection.setDocumentSectionMetadata(metadata);

        // Convert DocumentDTO to DocumentInstance using DocumentOnlyConverter
        DocumentInstance documentInstance = documentOnlyConverter.toEntity(documentInstanceSectionDTO.getDocumentInstanceDTO());
        documentInstanceSection.setDocumentInstance(documentInstance);


        return documentInstanceSection;
    }

}
