package dev.ctrlspace.gendox.gendoxcoreapi.services;


import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentInstanceConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.DocumentUtils;
import jakarta.annotation.Nullable;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.util.UUID;

@Service
public class UploadService {

    private final ChatThreadService chatThreadService;
    Logger logger = LoggerFactory.getLogger(UploadService.class);


    private DocumentService documentService;
    private ProjectDocumentService projectDocumentService;
    private AuditLogsService auditLogsService;
    private TypeService typeService;
    private DocumentUtils documentUtils;
    private DocumentInstanceConverter documentInstanceConverter;


    @Autowired
    public UploadService(@Lazy DocumentService documentService,
                         ProjectDocumentService projectDocumentService,
                         TypeService typeService,
                         AuditLogsService auditLogsService,
                         DocumentUtils documentUtils,
                         DocumentInstanceConverter documentInstanceConverter,
                         ChatThreadService chatThreadService) {
        this.documentService = documentService;
        this.projectDocumentService = projectDocumentService;
        this.typeService = typeService;
        this.auditLogsService = auditLogsService;
        this.documentUtils = documentUtils;
        this.documentInstanceConverter = documentInstanceConverter;
        this.chatThreadService = chatThreadService;
    }

    @Transactional
    public DocumentInstance uploadFile(MultipartFile file, UUID organizationId, UUID projectId) throws IOException, GendoxException {
        return this.uploadFile(file, organizationId, projectId, false, null, null);
    }

    /**
     *
     *
     * @param file the file uploaded
     * @param organizationId the organization the file belongs to
     * @param projectId  the project the file belongs to
     * @param messageAttachment true if the file is uploaded as a message attachment, false if it's uploaded from the document management module (which means it's intended to be added to the knowledge base)
     * @param userId if messageAttachment is true, the id of the user uploading the file, null otherwise
     * @param threadId if messageAttachment is true, the id of the thread the file is attached to. This is optional, the thread might not exists yet
     * @return
     * @throws IOException
     * @throws GendoxException
     */
    @Transactional(rollbackOn = Exception.class)
    public DocumentInstance uploadFile(MultipartFile file, UUID organizationId, UUID projectId, Boolean messageAttachment,
                                       @Nullable UUID userId,
                                       @Nullable UUID threadId) throws IOException, GendoxException {
        String fileName = file.getOriginalFilename();
        String cleanFileName = documentUtils.cleanFileName(fileName);
        String prefix = null;
        if (messageAttachment) {
            prefix = userId + (threadId != null ? "/" + threadId : "");
        }
        String fullFilePath = documentUtils.saveFile(file, organizationId, projectId, prefix);

        DocumentInstanceDTO instanceDTO = createDocumentInstanceDTO(file, organizationId, cleanFileName, fullFilePath);

        return upsertDocumentInstance(projectId, instanceDTO, messageAttachment, threadId);
    }

    private DocumentInstanceDTO createDocumentInstanceDTO(MultipartFile file, UUID organizationId, String fileName, String fullFilePath) throws IOException, GendoxException {

        return DocumentInstanceDTO
                .builder()
                .organizationId(organizationId)
                .remoteUrl(fullFilePath)
                .title(fileName)
                .fileType(typeService.getFileTypeByName("PLAIN_TEXT_FILE"))
                .documentIsccCode(documentUtils.getIsccCode(file))
                .fileSizeBytes(file.getSize())
                .build();
    }


    public DocumentInstance upsertDocumentInstance(UUID projectId, DocumentInstanceDTO documentInstanceDTO, Boolean isMessageAttachment, @Nullable UUID threadId) throws GendoxException, IOException {
        DocumentInstance existingInstance =
                documentService.getDocumentByRemoteUrl(documentInstanceDTO.getOrganizationId(), documentInstanceDTO.getRemoteUrl());

        if (existingInstance == null) {
            return createNewDocumentInstance(projectId, documentInstanceDTO, isMessageAttachment, threadId);
        } else {
            return updateExistingDocumentInstance(projectId, documentInstanceDTO, existingInstance);
        }

    }


        private DocumentInstance createNewDocumentInstance(UUID projectId, DocumentInstanceDTO documentInstanceDTO, Boolean isAttachment, @Nullable UUID threadId) throws GendoxException, IOException {
        UUID documentInstanceId = UUID.randomUUID();
        documentInstanceDTO.setId(documentInstanceId);
        DocumentInstance newInstance = documentInstanceConverter.toEntity(documentInstanceDTO);
        newInstance = documentService.createDocumentInstance(newInstance);
        if (isAttachment) {
            chatThreadService.createThreadDocument(projectId, newInstance.getId(), threadId);
        } else {
            projectDocumentService.createProjectDocument(projectId, newInstance.getId());
        }
        auditLogsService.createAuditLog(newInstance.getOrganizationId(), projectId, "DOCUMENT_CREATE", documentInstanceDTO.getFileSizeBytes());
        return newInstance;
    }

    private DocumentInstance updateExistingDocumentInstance(UUID projectId, DocumentInstanceDTO documentInstanceDTO, DocumentInstance existingInstance) throws GendoxException {
        documentInstanceDTO.setId(existingInstance.getId());
        DocumentInstance updatedInstance = documentInstanceConverter.toEntity(documentInstanceDTO);
        updatedInstance = documentService.updateDocument(updatedInstance);
        auditLogsService.createAuditLog(existingInstance.getOrganizationId(), projectId, "DOCUMENT_UPDATE", documentInstanceDTO.getFileSizeBytes());
        return updatedInstance;
    }


}
