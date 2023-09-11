package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentSectionMetadata;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentSectionMetadataDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class DocumentInstanceSectionConverter implements GendoxConverter<DocumentInstanceSection, DocumentInstanceSectionDTO> {

    private DocumentSectionMetadataConverter documentSectionMetadataConverter;

    @Autowired
    public DocumentInstanceSectionConverter(DocumentSectionMetadataConverter documentSectionMetadataConverter){
        this.documentSectionMetadataConverter = documentSectionMetadataConverter;
    }

    @Override
    public DocumentInstanceSectionDTO toDTO(DocumentInstanceSection documentInstanceSection) {
        DocumentInstanceSectionDTO documentInstanceSectionDTO = new DocumentInstanceSectionDTO();

        documentInstanceSectionDTO.setId(documentInstanceSection.getId());
        documentInstanceSectionDTO.setSectionValue(documentInstanceSection.getSectionValue());
        documentInstanceSectionDTO.setCreatedAt(documentInstanceSection.getCreatedAt());
        documentInstanceSectionDTO.setUpdatedAt(documentInstanceSection.getUpdatedAt());

        DocumentSectionMetadataDTO metadataDTO = documentSectionMetadataConverter.toDTO(documentInstanceSection.getDocumentSectionMetadata());
        documentInstanceSectionDTO.setDocumentSectionMetadataDTO(metadataDTO);

        return documentInstanceSectionDTO;
    }

    @Override
    public DocumentInstanceSection toEntity(DocumentInstanceSectionDTO documentInstanceSectionDTO) {
        DocumentInstanceSection documentInstanceSection = new DocumentInstanceSection();

        documentInstanceSection.setId(documentInstanceSectionDTO.getId());
        documentInstanceSection.setSectionValue(documentInstanceSectionDTO.getSectionValue());
        documentInstanceSection.setCreatedAt(documentInstanceSectionDTO.getCreatedAt());
        documentInstanceSection.setUpdatedAt(documentInstanceSectionDTO.getUpdatedAt());

        DocumentSectionMetadata metadata = documentSectionMetadataConverter.toEntity(documentInstanceSectionDTO.getDocumentSectionMetadataDTO());
        documentInstanceSection.setDocumentSectionMetadata(metadata);

        return documentInstanceSection;
    }
}
