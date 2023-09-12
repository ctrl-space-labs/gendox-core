package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentDTO;
import org.springframework.stereotype.Component;

@Component
public class DocumentOnlyConverter implements GendoxConverter<DocumentInstance, DocumentDTO> {
    @Override
    public DocumentDTO toDTO(DocumentInstance documentInstance) {
        DocumentDTO documentDTO = new DocumentDTO();

        documentDTO.setId(documentInstance.getId());
        documentDTO.setOrganizationId(documentInstance.getOrganizationId());
        documentDTO.setDocumentTemplateId(documentInstance.getDocumentTemplateId());
        documentDTO.setUserId(documentInstance.getUserId());
        documentDTO.setRemoteUrl(documentInstance.getRemoteUrl());
        documentDTO.setCreatedBy(documentInstance.getCreatedBy());
        documentDTO.setUpdatedBy(documentInstance.getUpdatedBy());
        documentDTO.setCreateAt(documentInstance.getCreatedAt());
        documentDTO.setUpdateAt(documentInstance.getUpdatedAt());

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


        return documentInstance;
    }
}
