package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class DocumentInstanceConverter implements GendoxConverter<DocumentInstance, DocumentInstanceDTO> {

    private DocumentInstanceSectionWithoutDocumentConverter documentInstanceSectionWithoutDocumentConverter;

    @Autowired
    public DocumentInstanceConverter(DocumentInstanceSectionWithoutDocumentConverter documentInstanceSectionWithoutDocumentConverter) {
        this.documentInstanceSectionWithoutDocumentConverter = documentInstanceSectionWithoutDocumentConverter;
    }

    @Override
    public DocumentInstanceDTO toDTO(DocumentInstance documentInstance) {
        DocumentInstanceDTO documentInstanceDTO = new DocumentInstanceDTO();

        if (documentInstance.getId() != null) {
            documentInstanceDTO.setId(documentInstance.getId());
        }
        if (documentInstance.getOrganizationId() != null) {
            documentInstanceDTO.setOrganizationId(documentInstance.getOrganizationId());
        }
        if (documentInstance.getDocumentTemplateId() != null) {
            documentInstanceDTO.setDocumentTemplateId(documentInstance.getDocumentTemplateId());
        }
        if (documentInstance.getRemoteUrl() != null) {
            documentInstanceDTO.setRemoteUrl(documentInstance.getRemoteUrl());
        }
        if (documentInstance.getCreatedBy() != null) {
            documentInstanceDTO.setCreatedBy(documentInstance.getCreatedBy());
        }
        if (documentInstance.getUpdatedBy() != null) {
            documentInstanceDTO.setUpdatedBy(documentInstance.getUpdatedBy());
        }
        if (documentInstance.getCreatedAt() != null) {
            documentInstanceDTO.setCreateAt(documentInstance.getCreatedAt());
        }
        if (documentInstance.getUpdatedAt() != null) {
            documentInstanceDTO.setUpdateAt(documentInstance.getUpdatedAt());
        }
        if (documentInstance.getDocumentSha256Hash() != null) {
            documentInstanceDTO.setDocumentSha256Hash(documentInstance.getDocumentSha256Hash());
        }
        if (documentInstance.getDocumentIsccCode() != null) {
            documentInstanceDTO.setDocumentIsccCode(documentInstance.getDocumentIsccCode());
        }
        if (documentInstance.getFileType() != null) {
            documentInstanceDTO.setFileType(documentInstance.getFileType());
        }
        if (documentInstance.getContentId() != null) {
            documentInstanceDTO.setContentId(documentInstance.getContentId());
        }
        if (documentInstance.getExternalUrl() != null) {
            documentInstanceDTO.setExternalUrl(documentInstance.getExternalUrl());
        }
        if (documentInstance.getTitle() != null) {
            documentInstanceDTO.setTitle(documentInstance.getTitle());
        }
        // Convert the List<DocumentInstanceSection> to List<DocumentInstanceSectionDTO>
        if (documentInstance.getDocumentInstanceSections() != null) {
            List<DocumentInstanceSectionDTO> sectionDTOs = new ArrayList<>();
            for (DocumentInstanceSection section : documentInstance.getDocumentInstanceSections()) {
                DocumentInstanceSectionDTO sectionDTO = documentInstanceSectionWithoutDocumentConverter.toDTO(section);
                sectionDTOs.add(sectionDTO);
            }
            documentInstanceDTO.setDocumentInstanceSections(sectionDTOs);
        }

        return documentInstanceDTO;
    }

    @Override
    public DocumentInstance toEntity(DocumentInstanceDTO documentInstanceDTO) {
        DocumentInstance documentInstance = new DocumentInstance();

        if (documentInstanceDTO.getId() != null) {
            documentInstance.setId(documentInstanceDTO.getId());
        }
        if (documentInstanceDTO.getOrganizationId() != null) {
            documentInstance.setOrganizationId(documentInstanceDTO.getOrganizationId());
        }
        if (documentInstanceDTO.getDocumentTemplateId() != null) {
            documentInstance.setDocumentTemplateId(documentInstanceDTO.getDocumentTemplateId());
        }
        if (documentInstanceDTO.getRemoteUrl() != null) {
            documentInstance.setRemoteUrl(documentInstanceDTO.getRemoteUrl());
        }
        if (documentInstanceDTO.getCreatedBy() != null) {
            documentInstance.setCreatedBy(documentInstanceDTO.getCreatedBy());
        }
        if (documentInstanceDTO.getUpdatedBy() != null) {
            documentInstance.setUpdatedBy(documentInstanceDTO.getUpdatedBy());
        }
        if (documentInstanceDTO.getCreateAt() != null) {
            documentInstance.setCreatedAt(documentInstanceDTO.getCreateAt());
        }
        if (documentInstanceDTO.getUpdateAt() != null) {
            documentInstance.setUpdatedAt(documentInstanceDTO.getUpdateAt());
        }

        if (documentInstanceDTO.getDocumentSha256Hash() != null) {
            documentInstance.setDocumentSha256Hash(documentInstanceDTO.getDocumentSha256Hash());
        }
        if (documentInstanceDTO.getDocumentIsccCode() != null) {
            documentInstance.setDocumentIsccCode(documentInstanceDTO.getDocumentIsccCode());
        }
        if (documentInstanceDTO.getFileType() != null) {
            documentInstance.setFileType(documentInstanceDTO.getFileType());
        }
        if (documentInstanceDTO.getContentId() != null) {
            documentInstance.setContentId(documentInstanceDTO.getContentId());
        }
        if (documentInstanceDTO.getExternalUrl() != null) {
            documentInstance.setExternalUrl(documentInstanceDTO.getExternalUrl());
        }
        if (documentInstanceDTO.getTitle() != null) {
            documentInstance.setTitle(documentInstanceDTO.getTitle());
        }

        if (documentInstanceDTO.getDocumentInstanceSections() != null) {
            List<DocumentInstanceSection> sections = new ArrayList<>();
            for (DocumentInstanceSectionDTO sectionDTO : documentInstanceDTO.getDocumentInstanceSections()) {
                DocumentInstanceSection section = documentInstanceSectionWithoutDocumentConverter.toEntity(sectionDTO);
                sections.add(section);
            }
            documentInstance.setDocumentInstanceSections(sections);
        }

        return documentInstance;
    }
}
