package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceDTO;
import org.springframework.stereotype.Component;

@Component
public class DocumentOnlyConverter implements GendoxConverter<DocumentInstance, DocumentInstanceDTO> {
    @Override
    public DocumentInstanceDTO toDTO(DocumentInstance documentInstance) {
        DocumentInstanceDTO documentInstanceDTO = new DocumentInstanceDTO();

        documentInstanceDTO.setId(documentInstance.getId());
        documentInstanceDTO.setOrganizationId(documentInstance.getOrganizationId());
        documentInstanceDTO.setDocumentTemplateId(documentInstance.getDocumentTemplateId());
        documentInstanceDTO.setDocumentIsccCode(documentInstance.getDocumentIsccCode());
        documentInstanceDTO.setRemoteUrl(documentInstance.getRemoteUrl());
        documentInstanceDTO.setCreatedBy(documentInstance.getCreatedBy());
        documentInstanceDTO.setUpdatedBy(documentInstance.getUpdatedBy());
        documentInstanceDTO.setCreateAt(documentInstance.getCreatedAt());
        documentInstanceDTO.setUpdateAt(documentInstance.getUpdatedAt());

        return documentInstanceDTO;
    }

    @Override
    public DocumentInstance toEntity(DocumentInstanceDTO documentInstanceDTO) {
        DocumentInstance documentInstance = new DocumentInstance();

        documentInstance.setId(documentInstanceDTO.getId());
        documentInstance.setOrganizationId(documentInstanceDTO.getOrganizationId());
        documentInstance.setDocumentTemplateId(documentInstanceDTO.getDocumentTemplateId());
        documentInstance.setDocumentIsccCode(documentInstanceDTO.getDocumentIsccCode());
        documentInstance.setRemoteUrl(documentInstanceDTO.getRemoteUrl());
        documentInstance.setCreatedBy(documentInstanceDTO.getCreatedBy());
        documentInstance.setUpdatedBy(documentInstanceDTO.getUpdatedBy());
        documentInstance.setCreatedAt(documentInstanceDTO.getCreateAt());
        documentInstance.setUpdatedAt(documentInstanceDTO.getUpdateAt());


        return documentInstance;
    }
}
