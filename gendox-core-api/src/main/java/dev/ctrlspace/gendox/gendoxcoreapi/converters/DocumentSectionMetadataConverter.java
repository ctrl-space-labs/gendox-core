package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentSectionMetadata;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentSectionMetadataDTO;
import org.springframework.stereotype.Component;

@Component
public class DocumentSectionMetadataConverter implements GendoxConverter<DocumentSectionMetadata, DocumentSectionMetadataDTO> {
    @Override
    public DocumentSectionMetadataDTO toDTO(DocumentSectionMetadata documentSectionMetadata) {
        DocumentSectionMetadataDTO documentSectionMetadataDTO = new DocumentSectionMetadataDTO();

        documentSectionMetadataDTO.setId(documentSectionMetadata.getId());
        documentSectionMetadataDTO.setDocumentTemplateId(documentSectionMetadata.getDocumentTemplateId());
        documentSectionMetadataDTO.setDocumentSectionTypeId(documentSectionMetadata.getDocumentSectionTypeId());
        documentSectionMetadataDTO.setTitle(documentSectionMetadata.getTitle());
        documentSectionMetadataDTO.setDescription(documentSectionMetadata.getDescription());
        documentSectionMetadataDTO.setSectionOptions(documentSectionMetadata.getSectionOptions());
        documentSectionMetadataDTO.setSectionOrder(documentSectionMetadata.getSectionOrder());
        documentSectionMetadataDTO.setCreatedBy(documentSectionMetadata.getCreatedBy());
        documentSectionMetadataDTO.setUpdatedBy(documentSectionMetadata.getUpdatedBy());
        documentSectionMetadataDTO.setCreatedAt(documentSectionMetadata.getCreatedAt());
        documentSectionMetadataDTO.setUpdatedAt(documentSectionMetadata.getUpdatedAt());


        return documentSectionMetadataDTO;
    }

    @Override
    public DocumentSectionMetadata toEntity(DocumentSectionMetadataDTO documentSectionMetadataDTO) {
        DocumentSectionMetadata documentSectionMetadata = new DocumentSectionMetadata();

        documentSectionMetadata.setId(documentSectionMetadataDTO.getId());
        documentSectionMetadata.setDocumentTemplateId(documentSectionMetadataDTO.getDocumentTemplateId());
        documentSectionMetadata.setDocumentSectionTypeId(documentSectionMetadataDTO.getDocumentSectionTypeId());
        documentSectionMetadata.setTitle(documentSectionMetadataDTO.getTitle());
        documentSectionMetadata.setDescription(documentSectionMetadataDTO.getDescription());
        documentSectionMetadata.setSectionOptions(documentSectionMetadataDTO.getSectionOptions());
        documentSectionMetadata.setSectionOrder(documentSectionMetadataDTO.getSectionOrder());
        documentSectionMetadata.setCreatedBy(documentSectionMetadataDTO.getCreatedBy());
        documentSectionMetadata.setUpdatedBy(documentSectionMetadataDTO.getUpdatedBy());
        documentSectionMetadata.setCreatedAt(documentSectionMetadataDTO.getCreatedAt());
        documentSectionMetadata.setUpdatedAt(documentSectionMetadataDTO.getUpdatedAt());

        return documentSectionMetadata;
    }
}
