package dev.ctrlspace.gendox.gendoxcoreapi.services;


import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentInstanceConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AuditLogs;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectDocument;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.DocumentUtils;
import dev.ctrlspace.gendox.provenAi.utils.MockUniqueIdentifierServiceAdapter;
import dev.ctrlspace.gendox.provenAi.utils.UniqueIdentifierCodeResponse;
import dev.ctrlspace.provenai.iscc.IsccCodeResponse;
import dev.ctrlspace.provenai.iscc.IsccCodeService;
import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ResourceLoader;
import org.springframework.core.io.WritableResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;


import java.io.*;
import java.util.UUID;

@Service
public class UploadService {

    Logger logger = LoggerFactory.getLogger(UploadService.class);


    private DocumentService documentService;
    private ProjectDocumentService projectDocumentService;
    private AuditLogsService auditLogsService;
    private TypeService typeService;
    private DocumentUtils documentUtils;
    private DocumentInstanceConverter documentInstanceConverter;


    @Autowired
    public UploadService(DocumentService documentService,
                         ProjectDocumentService projectDocumentService,
                         TypeService typeService,
                         AuditLogsService auditLogsService,
                         DocumentUtils documentUtils,
                         DocumentInstanceConverter documentInstanceConverter) {
        this.documentService = documentService;
        this.projectDocumentService = projectDocumentService;
        this.typeService = typeService;
        this.auditLogsService = auditLogsService;
        this.documentUtils = documentUtils;
        this.documentInstanceConverter = documentInstanceConverter;
    }


    @Transactional
    public DocumentInstance uploadFile(MultipartFile file, UUID organizationId, UUID projectId) throws IOException, GendoxException {
        String fileName = file.getOriginalFilename();
        String cleanFileName = documentUtils.cleanFileName(fileName);
        String fullFilePath = documentUtils.saveFile(file, organizationId, projectId);

        DocumentInstanceDTO instanceDTO = createDocumentInstanceDTO(file, organizationId, cleanFileName, fullFilePath);

        return upsertDocumentInstance(projectId, instanceDTO);
    }

    private DocumentInstanceDTO createDocumentInstanceDTO(MultipartFile file, UUID organizationId, String fileName, String fullFilePath) throws IOException, GendoxException {

        return DocumentInstanceDTO
                .builder()
                .organizationId(organizationId)
                .remoteUrl(fullFilePath)
                .title(fileName)
                .fileType(typeService.getFileTypeByName("PLAIN_TEXT_FILE"))
                .documentIsccCode(documentUtils.getIsccCode(file))
                .build();
    }


    public DocumentInstance upsertDocumentInstance(UUID projectId, DocumentInstanceDTO documentInstanceDTO) throws GendoxException {
        String documentNameByRemoteUrl = documentUtils.extractDocumentNameFromUrl(documentInstanceDTO.getRemoteUrl());
        DocumentInstance existingInstance =
                documentService.getDocumentByFileName(projectId, documentInstanceDTO.getOrganizationId(), documentNameByRemoteUrl);

        if (existingInstance == null) {
            return createNewDocumentInstance(projectId, documentInstanceDTO);
        } else {
            return updateExistingDocumentInstance(projectId, documentInstanceDTO, existingInstance);
        }

    }


    private DocumentInstance createNewDocumentInstance(UUID projectId, DocumentInstanceDTO documentInstanceDTO) throws GendoxException {
        UUID documentInstanceId = UUID.randomUUID();
        documentInstanceDTO.setId(documentInstanceId);
        DocumentInstance newInstance = documentInstanceConverter.toEntity(documentInstanceDTO);
        newInstance = documentService.createDocumentInstance(newInstance);
        projectDocumentService.createProjectDocument(projectId, newInstance.getId());
        auditLogsService.createAuditLog(newInstance.getOrganizationId(), projectId, "DOCUMENT_CREATE",null);
        return newInstance;
    }

    private DocumentInstance updateExistingDocumentInstance(UUID projectId, DocumentInstanceDTO documentInstanceDTO, DocumentInstance existingInstance) throws GendoxException {
        documentInstanceDTO.setId(existingInstance.getId());
        DocumentInstance updatedInstance = documentInstanceConverter.toEntity(documentInstanceDTO);
        updatedInstance = documentService.updateDocument(updatedInstance);
        auditLogsService.createAuditLog(existingInstance.getOrganizationId(), projectId, "DOCUMENT_UPDATE",null);
        return updatedInstance;
    }


}
