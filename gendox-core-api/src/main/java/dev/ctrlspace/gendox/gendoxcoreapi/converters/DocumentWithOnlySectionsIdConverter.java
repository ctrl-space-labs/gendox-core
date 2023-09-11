package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentDTO;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class DocumentWithOnlySectionsIdConverter implements GendoxConverter<DocumentInstance, DocumentDTO> {
    @Override
    public DocumentDTO toDTO(DocumentInstance documentInstance) {
        DocumentDTO documentDTO = new DocumentDTO();

        documentDTO.setId(documentInstance.getId());
        documentDTO.setOrganizationId(documentInstance.getOrganizationId());
        documentDTO.setDocumentTemplateId(documentInstance.getDocumentTemplateId());
        documentDTO.setUserId(documentInstance.getUserId());
        documentDTO.setCreateAt(documentInstance.getCreatedAt());
        documentDTO.setUpdateAt(documentInstance.getUpdatedAt());


        // Create a list to store UUIDs of document instance sections
        List<UUID> sectionIds = new ArrayList<>();

        // Iterate through documentInstanceSections and extract UUIDs
        for (DocumentInstanceSection section : documentInstance.getDocumentInstanceSections()) {
            sectionIds.add(section.getId());
        }

        // Set the list of section UUIDs in the DTO
        documentDTO.setDocumentInstanceSectionIds(sectionIds);

        return documentDTO;
    }

    @Override
    public DocumentInstance toEntity(DocumentDTO documentDTO) {
        DocumentInstance documentInstance = new DocumentInstance();

        documentInstance.setId(documentDTO.getId());
        documentInstance.setOrganizationId(documentDTO.getOrganizationId());
        documentInstance.setDocumentTemplateId(documentDTO.getDocumentTemplateId());
        documentInstance.setUserId(documentDTO.getUserId());
        documentInstance.setCreatedAt(documentDTO.getCreateAt());
        documentInstance.setUpdatedAt(documentDTO.getUpdateAt());
       // documentInstance.setDocumentInstanceSections(documentDTO.getDocumentInstanceSectionList());


        return documentInstance;
    }
}
