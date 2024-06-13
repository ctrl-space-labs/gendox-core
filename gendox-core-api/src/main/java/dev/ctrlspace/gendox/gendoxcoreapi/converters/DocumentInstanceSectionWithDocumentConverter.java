package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentSectionMetadata;
import dev.ctrlspace.gendox.gendoxcoreapi.model.EmbeddingGroup;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentSectionMetadataDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.EmbeddingGroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Optional;

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
        DocumentInstanceSectionDTO documentInstanceSectionDTO = new DocumentInstanceSectionDTO();
        Optional<EmbeddingGroup> embeddingGroupOptional = embeddingGroupRepository.findBySectionIdOrMessageId(documentInstanceSection.getId(), null);

        documentInstanceSectionDTO.setId(documentInstanceSection.getId());
        documentInstanceSectionDTO.setSectionValue(documentInstanceSection.getSectionValue());
        documentInstanceSectionDTO.setDocumentSectionIsccCode(documentInstanceSection.getDocumentSectionIsccCode());
        documentInstanceSectionDTO.setTokenCount(embeddingGroupOptional.get().getTokenCount());
        documentInstanceSectionDTO.setAiModelName(aiModelRepository.findNameById(embeddingGroupOptional.get().getSemanticSearchModelId()));
        documentInstanceSectionDTO.setCreatedBy(documentInstanceSection.getCreatedBy());
        documentInstanceSectionDTO.setUpdatedBy(documentInstanceSection.getUpdatedBy());
        documentInstanceSectionDTO.setCreatedAt(documentInstanceSection.getCreatedAt());
        documentInstanceSectionDTO.setUpdatedAt(documentInstanceSection.getUpdatedAt());

        DocumentSectionMetadataDTO metadataDTO = documentSectionMetadataConverter.toDTO(documentInstanceSection.getDocumentSectionMetadata());
        documentInstanceSectionDTO.setDocumentSectionMetadata(metadataDTO);

        if (documentInstanceSection.getDocumentInstance() != null) {

            DocumentDTO documentDTO = documentOnlyConverter.toDTO(documentInstanceSection.getDocumentInstance());
            documentInstanceSectionDTO.setDocumentDTO(documentDTO);
        }

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
            DocumentInstance documentInstance = documentOnlyConverter.toEntity(documentInstanceSectionDTO.getDocumentDTO());
            documentInstanceSection.setDocumentInstance(documentInstance);


        return documentInstanceSection;
    }

}
