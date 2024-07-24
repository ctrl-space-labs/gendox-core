package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentSectionMetadata;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentSectionMetadataDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class DocumentInstanceSectionWithoutDocumentConverter implements GendoxConverter<DocumentInstanceSection, DocumentInstanceSectionDTO> {

    private DocumentSectionMetadataConverter documentSectionMetadataConverter;


    @Autowired
    public DocumentInstanceSectionWithoutDocumentConverter(DocumentSectionMetadataConverter documentSectionMetadataConverter

    ){
        this.documentSectionMetadataConverter = documentSectionMetadataConverter;

    }

    @Override
    public DocumentInstanceSectionDTO toDTO(DocumentInstanceSection documentInstanceSection) {
        DocumentInstanceSectionDTO documentInstanceSectionDTO = new DocumentInstanceSectionDTO();

        documentInstanceSectionDTO.setId(documentInstanceSection.getId());
        documentInstanceSectionDTO.setSectionValue(documentInstanceSection.getSectionValue());
        documentInstanceSectionDTO.setCreatedBy(documentInstanceSection.getCreatedBy());
        documentInstanceSectionDTO.setUpdatedBy(documentInstanceSection.getUpdatedBy());
        documentInstanceSectionDTO.setCreatedAt(documentInstanceSection.getCreatedAt());
        documentInstanceSectionDTO.setUpdatedAt(documentInstanceSection.getUpdatedAt());

        DocumentSectionMetadataDTO metadataDTO = documentSectionMetadataConverter.toDTO(documentInstanceSection.getDocumentSectionMetadata());
        documentInstanceSectionDTO.setDocumentSectionMetadata(metadataDTO);

        if (documentInstanceSection.getDocumentInstance() != null) {

//        DocumentDTO documentDTO = documentConverter.toDTO(documentInstanceSection.getDocumentInstance());
//        documentInstanceSectionDTO.setDocumentDTO(documentDTO);
        }

        return documentInstanceSectionDTO;
    }

    @Override
    public DocumentInstanceSection toEntity(DocumentInstanceSectionDTO documentInstanceSectionDTO) {
        DocumentInstanceSection documentInstanceSection = new DocumentInstanceSection();

        documentInstanceSection.setId(documentInstanceSectionDTO.getId());
        documentInstanceSection.setSectionValue(documentInstanceSectionDTO.getSectionValue());
        documentInstanceSection.setCreatedBy(documentInstanceSectionDTO.getCreatedBy());
        documentInstanceSection.setUpdatedBy(documentInstanceSectionDTO.getUpdatedBy());
        documentInstanceSection.setCreatedAt(documentInstanceSectionDTO.getCreatedAt());
        documentInstanceSection.setUpdatedAt(documentInstanceSectionDTO.getUpdatedAt());

        DocumentSectionMetadata metadata = documentSectionMetadataConverter.toEntity(documentInstanceSectionDTO.getDocumentSectionMetadata());
        documentInstanceSection.setDocumentSectionMetadata(metadata);

//        DocumentInstance documentInstance = documentConverter.toEntity(documentInstanceSectionDTO.getDocumentDTO());
//        documentInstanceSection.setDocumentInstance(documentInstance);



        return documentInstanceSection;
    }
}
