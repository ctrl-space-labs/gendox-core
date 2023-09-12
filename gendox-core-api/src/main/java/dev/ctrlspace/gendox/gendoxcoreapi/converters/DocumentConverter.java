package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class DocumentConverter implements GendoxConverter<DocumentInstance, DocumentDTO> {

    private DocumentInstanceSectionConverter documentInstanceSectionConverter;

    @Autowired
    public DocumentConverter(DocumentInstanceSectionConverter documentInstanceSectionConverter){
        this.documentInstanceSectionConverter = documentInstanceSectionConverter;
    }

    @Override
    public DocumentDTO toDTO(DocumentInstance documentInstance) {
        DocumentDTO documentDTO = new DocumentDTO();

        documentDTO.setId(documentInstance.getId());
        documentDTO.setOrganizationId(documentInstance.getOrganizationId());
        documentDTO.setDocumentTemplateId(documentInstance.getDocumentTemplateId());
        documentDTO.setUserId(documentInstance.getUserId());
        documentDTO.setRemoteUrl(documentInstance.getRemoteUrl());
        documentDTO.setRemoteUrl(documentInstance.getRemoteUrl());
        documentDTO.setCreatedBy(documentInstance.getCreatedBy());
        documentDTO.setCreateAt(documentInstance.getCreatedAt());
        documentDTO.setUpdateAt(documentInstance.getUpdatedAt());

        // Convert the List<DocumentInstanceSection> to List<DocumentInstanceSectionDTO>
        List<DocumentInstanceSectionDTO> sectionDTOs = new ArrayList<>();
        for (DocumentInstanceSection section : documentInstance.getDocumentInstanceSections()) {
            DocumentInstanceSectionDTO sectionDTO = documentInstanceSectionConverter.toDTO(section);
            sectionDTOs.add(sectionDTO);        }

        // Set the list of section DTOs in the DTO
        documentDTO.setDocumentInstanceSections(sectionDTOs);

        return documentDTO;
    }

    @Override
    public DocumentInstance toEntity(DocumentDTO documentDTO) {
        DocumentInstance documentInstance = new DocumentInstance();

        documentInstance.setId(documentDTO.getId());
        documentInstance.setOrganizationId(documentDTO.getOrganizationId());
        documentInstance.setDocumentTemplateId(documentDTO.getDocumentTemplateId());
        documentInstance.setUserId(documentDTO.getUserId());
        documentInstance.setRemoteUrl(documentDTO.getRemoteUrl());
        documentInstance.setCreatedBy(documentDTO.getCreatedBy());
        documentInstance.setUpdatedBy(documentDTO.getUpdatedBy());
        documentInstance.setCreatedAt(documentDTO.getCreateAt());
        documentInstance.setUpdatedAt(documentDTO.getUpdateAt());


        List <DocumentInstanceSection> sections = new ArrayList<>();
        for (DocumentInstanceSectionDTO sectionDTO : documentDTO.getDocumentInstanceSections()){
            DocumentInstanceSection section = documentInstanceSectionConverter.toEntity(sectionDTO);
            sections.add(section);
        }

        documentInstance.setDocumentInstanceSections(sections);

        return documentInstance;
    }
}
